import dayjs from "dayjs";
import db from "..//dao/dao.mjs";

// DOCENTE DAO

// Ottieni tutti gli studenti (ruolo = studente)
export const ottieniListaStudenti = () => {
  return new Promise((resolve, reject) => {
    const sql =
      'SELECT id, nome, cognome FROM utenti WHERE ruolo = "studente" ORDER BY id';
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Funzione per creare un nuovo compito ed assegnarlo agli studenti
export const creaCompito = (traccia, studentiIds, creatoDa) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION", (err) => {
        if (err) return reject(err);

        const stato = "aperto";
        const numeroStudenti = studentiIds.length;
        const creatoIl = dayjs().format('YYYY-MM-DD HH:mm:ss');

        const sql = `
          INSERT INTO compiti (traccia, creato_da, stato, numero_studenti, creato_il)
          VALUES (?, ?, ?, ?, ?)
        `;

        db.run(sql, [traccia, creatoDa, stato, numeroStudenti, creatoIl], function (err) {
          if (err) {
            return db.run("ROLLBACK", () => reject(err));
          }

          const compitoId = this.lastID;

          // esegue tutte le operazioni nella stessa transazione
          assegnaStudenti(compitoId, studentiIds)
            .then(() => aggiornaCollaborazioni(studentiIds, creatoDa))
            .then(() => {
              // se tutto va bene, commit della transazione
              db.run("COMMIT", (err) => {
                if (err) {
                  return db.run("ROLLBACK", () => reject(err));
                }
                resolve({ id: compitoId, creato_il: creatoIl });
              });
            })
            .catch((error) => {
              // se qualcosa va male, rollback di TUTTO
              db.run("ROLLBACK", () => reject(error));
            });
        });
      });
    });
  });
};

// Funzione per assegnare studenti a un compito - usata in creaCompito
const assegnaStudenti = (compitoId, studentiIds) => {
  return new Promise((resolve, reject) => {
    if (!studentiIds || studentiIds.length === 0) {
      return resolve();
    }

    const sql = "INSERT INTO assegnazioni_compiti (compito_id, studente_id) VALUES (?, ?)";
    let completati = 0;
    let erroreOccorso = false;

    studentiIds.forEach((id) => {
      if (erroreOccorso) return;

      db.run(sql, [compitoId, id], (err) => {
        if (err && !erroreOccorso) {
          erroreOccorso = true;
          return reject(new Error(`Errore nell'assegnazione dello studente ${id}: ${err.message}`));
        }

        completati++;
        if (completati === studentiIds.length && !erroreOccorso) {
          resolve();
        }
      });
    });
  });
};

// funzione per aggiornare il conteggio delle collaborazioni tra studenti per quel docente - usata in creaCompito
const aggiornaCollaborazioni = (studentiIds, docenteId) => {
  return new Promise((resolve, reject) => {
    if (!studentiIds || studentiIds.length < 2) {
      return resolve();
    }

    const coppie = [];
    
    // genera tutte le coppie
    for (let i = 0; i < studentiIds.length; i++) {
      for (let j = i + 1; j < studentiIds.length; j++) {
        const s1 = Math.min(studentiIds[i], studentiIds[j]);
        const s2 = Math.max(studentiIds[i], studentiIds[j]);
        coppie.push({ s1, s2 });
      }
    }

    let completati = 0;
    let erroreOccorso = false;

    coppie.forEach(({ s1, s2 }) => {
      if (erroreOccorso) return;

      const checkSql = `
        SELECT numero_collaborazioni 
        FROM collaborazioni_studenti 
        WHERE studente1_id = ? AND studente2_id = ? AND docente_id = ?
      `;
      
      db.get(checkSql, [s1, s2, docenteId], (err, row) => {
        if (err && !erroreOccorso) {
          erroreOccorso = true;
          return reject(new Error(`Errore nel controllo collaborazioni ${s1}-${s2}: ${err.message}`));
        }

        if (row) {
          // aggiorna collaborazione esistente
          const updateSql = `
            UPDATE collaborazioni_studenti 
            SET numero_collaborazioni = numero_collaborazioni + 1 
            WHERE studente1_id = ? AND studente2_id = ? AND docente_id = ?
          `;
          db.run(updateSql, [s1, s2, docenteId], (err) => {
            if (err && !erroreOccorso) {
              erroreOccorso = true;
              return reject(new Error(`Errore nell'aggiornamento collaborazione ${s1}-${s2}: ${err.message}`));
            }

            completati++;
            if (completati === coppie.length && !erroreOccorso) {
              resolve();
            }
          });
        } else {
          // crea nuova collaborazione
          const insertSql = `
            INSERT INTO collaborazioni_studenti 
            (studente1_id, studente2_id, docente_id, numero_collaborazioni) 
            VALUES (?, ?, ?, 1)
          `;
          db.run(insertSql, [s1, s2, docenteId], (err) => {
            if (err && !erroreOccorso) {
              erroreOccorso = true;
              return reject(new Error(`Errore nella creazione collaborazione ${s1}-${s2}: ${err.message}`));
            }

            completati++;
            if (completati === coppie.length && !erroreOccorso) {
              resolve();
            }
          });
        }
      });
    });
  });
};

// Funzione per ottenere le collaborazioni tra coppie di studenti per quel docente con un conteggio minimo
// Restituisce un oggetto con le coppie come chiavi e il numero di collaborazioni come valori
// Esempio: { "1-2": 3, "1-3": 2, "2-3": 1 }
// Nota: le coppie sono sempre ordinate (min, max) per evitare duplicati come "1-2" e "2-1"
export const ottieniCollaborazioniStudenti = (docenteId, minCount = 2) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT studente1_id, studente2_id, numero_collaborazioni
      FROM collaborazioni_studenti
      WHERE docente_id = ?
      AND numero_collaborazioni >= ?
    `;
    db.all(sql, [docenteId, minCount], (err, rows) => {
      if (err) return reject(err);

      const collaborations = {};
      for (const row of rows) {
        const key = `${row.studente1_id}-${row.studente2_id}`;
        collaborations[key] = row.numero_collaborazioni;
      }

      resolve(collaborations);
    });
  });
};

// Controlla se le coppie di studenti superano il limite minimo di collaborazioni
export const checkLimiteCoppiaStudenti = (studentiIds, docenteId, minLimit = 2) => {
  return new Promise((resolve, reject) => {
    //se ci sono meno di 2 studenti, non c'è coppia da controllare
    if (studentiIds.length < 2) return resolve({ allowed: true });

    //crea tutte le possibili coppie di studenti e genera condizioni SQL del tipo: (studente1_id = ? AND studente2_id = ?) OR (studente1_id = ? AND studente2_id = ?)
    const conditions = studentiIds.flatMap((id1, i) => 
      studentiIds.slice(i + 1).map(id2 => '(studente1_id = ? AND studente2_id = ?)') //senza appunto mettere già i parametri
    ).join(' OR ');

    //parametri per la query: docenteId, minLimit e poi tutte le coppie di studenti in ordine crescente
    const params = [docenteId, minLimit, ...studentiIds.flatMap((id1, i) => 
      studentiIds.slice(i + 1).flatMap(id2 => id1 < id2 ? [id1, id2] : [id2, id1])
    )];

    const sql = `SELECT 
        c.studente1_id, 
        c.studente2_id, 
        c.numero_collaborazioni,
        s1.nome as nome1,
        s1.cognome as cognome1,
        s2.nome as nome2,
        s2.cognome as cognome2
      FROM collaborazioni_studenti c
      JOIN utenti s1 ON c.studente1_id = s1.id
      JOIN utenti s2 ON c.studente2_id = s2.id
      WHERE c.docente_id = ? AND c.numero_collaborazioni >= ? AND (${conditions}) LIMIT 1`;

    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row ? {
        allowed: false,
        coppia: [`${row.nome1} ${row.cognome1}`, `${row.nome2} ${row.cognome2}`],
        count: row.numero_collaborazioni
      } : { allowed: true });
    });
  });
};


// Verifica stato compito e presenza risposta per effettuare la valutazione
export const verificaCompitoPerValutazione = (compitoId, docenteId) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT c.stato, 
      EXISTS(SELECT 1 FROM risposte_compiti WHERE compito_id = c.id) as ha_risposta,
      r.aggiornato_il as ultima_modifica_risposta
      FROM compiti c 
      LEFT JOIN risposte_compiti r ON c.id = r.compito_id
      WHERE c.id = ? AND c.creato_da = ?`,
      [compitoId, docenteId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
};

// Valuta e chiude un compito
export const valutaEChiudiCompito = (compitoId, punteggio) => {
  return new Promise((resolve, reject) => {
    const now = dayjs().format("YYYY-MM-DD HH:mm:ss");
    db.run(
      `UPDATE compiti 
       SET punteggio = ?, stato = 'chiuso', chiuso_il = ?
       WHERE id = ?`,
      [punteggio, now, compitoId],
      function (err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      }
    );
  });
};

export const ottieniStatisticheClasse = (docenteId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        u.id, u.nome, u.cognome,
        COUNT(CASE WHEN c.stato = 'aperto' THEN 1 END) as aperti,
        COUNT(CASE WHEN c.stato = 'chiuso' THEN 1 END) as chiusi,
        COUNT(c.id) as totale,
        CASE 
          WHEN SUM(CASE WHEN c.stato = 'chiuso' AND c.punteggio IS NOT NULL THEN 1.0 / c.numero_studenti ELSE 0 END) > 0
          THEN ROUND(
            SUM(CASE WHEN c.stato = 'chiuso' AND c.punteggio IS NOT NULL THEN c.punteggio * (1.0 / c.numero_studenti) ELSE 0 END) 
            / 
            SUM(CASE WHEN c.stato = 'chiuso' AND c.punteggio IS NOT NULL THEN 1.0 / c.numero_studenti ELSE 0 END)
          , 3)
          ELSE NULL
        END as media
      FROM utenti u
      LEFT JOIN assegnazioni_compiti ac ON u.id = ac.studente_id
      LEFT JOIN compiti c ON ac.compito_id = c.id AND c.creato_da = ?
      WHERE u.ruolo = 'studente'
      GROUP BY u.id, u.nome, u.cognome
      ORDER BY u.id
    `;
    //Media = Somma(punteggio_individuale) / Somma(pesi)
    // pesi = 1 / numero_studenti
    // left join per includere anche studenti senza compiti e punteggi

    db.all(sql, [docenteId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const statistiche = rows.map(row => ({
          id: row.id,
          nome: row.nome,
          cognome: row.cognome,
          aperti: row.aperti || 0,
          chiusi: row.chiusi || 0,
          totale: row.totale || 0,
          media: row.media ? Math.round(row.media * 100) / 100 : null,
        }));
        resolve(statistiche);
      }
    });
  });
};

//Ottiene statistiche per uno studente specifico
export const ottieniStatisticheStudente = (studenteId, docenteId) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT 
          COUNT(CASE WHEN c.stato = 'aperto' THEN 1 END) as aperti,
          COUNT(CASE WHEN c.stato = 'chiuso' THEN 1 END) as chiusi,
          COUNT(c.id) as totale,
          CASE 
            WHEN SUM(CASE WHEN c.stato = 'chiuso' AND c.punteggio IS NOT NULL THEN 1.0 / c.numero_studenti ELSE 0 END) > 0
            THEN ROUND(
              SUM(CASE WHEN c.stato = 'chiuso' AND c.punteggio IS NOT NULL THEN c.punteggio * (1.0 / c.numero_studenti) ELSE 0 END) 
              / 
              SUM(CASE WHEN c.stato = 'chiuso' AND c.punteggio IS NOT NULL THEN 1.0 / c.numero_studenti ELSE 0 END)
            , 3)
            ELSE NULL
          END as media
        FROM assegnazioni_compiti ac
        JOIN compiti c ON ac.compito_id = c.id
        WHERE ac.studente_id = ? AND c.creato_da = ?
        `,
      [studenteId, docenteId],
      (err, row) => {
        if (err) reject(err);
        else
          resolve({
            aperti: row.aperti || 0,
            chiusi: row.chiusi || 0,
            totale: row.totale || 0,
            media: row.media ? Math.round(row.media * 100) / 100 : null,
          });
      }
    );
  });
};

// Ottiene tutti i compiti di un docente con solo flag risposta
export const ottieniCompitiDocente = (docenteId) => {
  return new Promise((resolve, reject) => {
    let sql = `
      SELECT 
        c.id, c.traccia, c.stato, c.numero_studenti, c.punteggio, c.creato_il, c.chiuso_il,
        u.nome as docente_nome, u.cognome as docente_cognome,
        s.id as studente_id, s.nome as studente_nome, s.cognome as studente_cognome,
        CASE WHEN rc.id IS NOT NULL THEN 1 ELSE 0 END as ha_risposta
      FROM compiti c
      JOIN utenti u ON c.creato_da = u.id
      LEFT JOIN assegnazioni_compiti ac ON c.id = ac.compito_id
      LEFT JOIN utenti s ON ac.studente_id = s.id
      LEFT JOIN risposte_compiti rc ON c.id = rc.compito_id
      WHERE c.creato_da = ?
      ORDER BY c.creato_il DESC
    `;

    db.all(sql, [docenteId], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      // Raggruppamento efficiente con Map
      const compitiMap = new Map();

      rows.forEach(row => {
        const compitoId = row.id;
        
        if (!compitiMap.has(compitoId)) {
          compitiMap.set(compitoId, {
            id: row.id,
            traccia: row.traccia,
            stato: row.stato,
            numero_studenti: row.numero_studenti,
            punteggio: row.punteggio,
            creato_il: row.creato_il,
            chiuso_il: row.chiuso_il,
            docente: {
              id: docenteId,
              nome: row.docente_nome,
              cognome: row.docente_cognome
            },
            gruppo: [],
            ha_risposta: row.ha_risposta === 1
          });
        }

        // Aggiungi studente se presente e non già aggiunto
        if (row.studente_id) {
          const compito = compitiMap.get(compitoId);
          const studenteEsistente = compito.gruppo.find(s => s.id === row.studente_id);
          
          if (!studenteEsistente) {
            compito.gruppo.push({
              id: row.studente_id,
              nome: row.studente_nome,
              cognome: row.studente_cognome
            });
          }
        }
      });

      resolve(Array.from(compitiMap.values()));
    });
  });
};
