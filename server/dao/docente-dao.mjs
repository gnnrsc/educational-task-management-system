import dayjs from "dayjs";
import db from "..//dao/dao.mjs";

// DOCENTE DAO

// Ottieni tutti gli studenti (ruolo = studente)
export const getAllStudents = () => {
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
export const createTask = (traccia, studentIds, creatoDa) => {
  return new Promise((resolve, reject) => {
    const stato = "aperto";
    const numeroStudenti = studentIds.length;
    const creatoIl = dayjs().format('YYYY-MM-DD HH:mm:ss');

    const sql = `
      INSERT INTO compiti (traccia, creato_da, stato, numero_studenti, creato_il)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.run(
      sql,
      [traccia, creatoDa, stato, numeroStudenti, creatoIl],
      function (err) {
        if (err) return reject(err);
        const compitoId = this.lastID;

        assegnaStudenti(compitoId, studentIds)
          .then(() => {
            // Lancia aggiornaCollaborazioni senza aspettarla
            aggiornaCollaborazioni(studentIds, creatoDa).catch((err) => {
              console.error("Errore aggiornamento collaborazioni:", err);
            });
            // Risolvi subito, senza aspettare aggiornaCollaborazioni
            resolve({ id: compitoId, creato_il: creatoIl });
          })
          .catch(reject);
      }
    );
  });
};

//Funzione per assegnare studenti a un compito
export const assegnaStudenti = (compitoId, studentIds) => {
  const sql =
    "INSERT INTO assegnazioni_compiti (compito_id, studente_id) VALUES (?, ?)";
  const promesse = studentIds.map((id) => {
    return new Promise((res, rej) => {
      db.run(sql, [compitoId, id], (err) => {
        if (err) rej(err);
        else res();
      });
    });
  });
  return Promise.all(promesse);
};

//Funzione per aggiornare il conteggio di collaborazioni tra studenti per quel docente
export const aggiornaCollaborazioni = (studentIds, docenteId) => {
  const tasks = [];

  //per ogni combinazione di coppia di studenti del gruppo, aggiungi o aggiorna il conteggio
  for (let i = 0; i < studentIds.length; i++) {
    for (let j = i + 1; j < studentIds.length; j++) {
      const s1 = Math.min(studentIds[i], studentIds[j]);
      const s2 = Math.max(studentIds[i], studentIds[j]);

      tasks.push(
        new Promise((res, rej) => {
          const checkSql =
            "SELECT numero_collaborazioni FROM collaborazioni_studenti WHERE studente1_id = ? AND studente2_id = ? AND docente_id = ?";
          db.get(checkSql, [s1, s2, docenteId], (err, row) => {
            if (err) return rej(err);

            if (row) {
              const updateSql =
                "UPDATE collaborazioni_studenti SET numero_collaborazioni = numero_collaborazioni + 1 WHERE studente1_id = ? AND studente2_id = ? AND docente_id = ?";
              db.run(updateSql, [s1, s2, docenteId], (err) =>
                err ? rej(err) : res()
              );
            } else {
              const insertSql =
                "INSERT INTO collaborazioni_studenti (studente1_id, studente2_id, docente_id, numero_collaborazioni) VALUES (?, ?, ?, 1)";
              db.run(insertSql, [s1, s2, docenteId], (err) =>
                err ? rej(err) : res()
              );
            }
          });
        })
      );
    }
  }

  return Promise.all(tasks);
};

// Funzione per ottenere le collaborazioni tra coppie di studenti per quel docente con un conteggio minimo
// Restituisce un oggetto con le coppie come chiavi e il numero di collaborazioni come valori
// Esempio: { "1-2": 3, "1-3": 2, "2-3": 1 }
// Nota: le coppie sono sempre ordinate (min, max) per evitare duplicati come "1-2" e "2-1"
export const getStudentPairsCollaborations = (docenteId, minCount = 2) => {
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

export const checkStudentPairLimit = (studentIds, docenteId, minLimit = 2) => {
  return new Promise(async (resolve, reject) => {
    try {
      const collaborations = await getStudentPairsCollaborations(
        docenteId,
        minLimit
      );

      const pairKey = (id1, id2) =>
        id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;

      for (let i = 0; i < studentIds.length; i++) {
        for (let j = i + 1; j < studentIds.length; j++) {
          const key = pairKey(studentIds[i], studentIds[j]);
          if (collaborations[key]) {
            return resolve({
              allowed: false,
              pair: [studentIds[i], studentIds[j]],
              count: collaborations[key],
            });
          }
        }
      }

      resolve({ allowed: true });
    } catch (error) {
      reject(error);
    }
  });
};

// Recupera risposta di un compito per un docente
export const getRispostaCompito = (compitoId, docenteId) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT id, traccia, stato, numero_studenti, punteggio
       FROM compiti 
       WHERE id = ? AND creato_da = ?`,
      [compitoId, docenteId],
      (err, compito) => {
        if (err) return reject(err);
        if (!compito) return resolve(null); // Compito non trovato

        db.get(
          `SELECT r.testo_risposta, r.aggiornato_il, r.inviato_da,
                  u.nome AS risposta_nome, u.cognome AS risposta_cognome
           FROM risposte_compiti r
           LEFT JOIN utenti u ON u.id = r.inviato_da
           WHERE r.compito_id = ?`,
          [compitoId],
          (err2, risposta) => {
            if (err2) return reject(err2);

            // anche se risposta è undefined, restituiamo comunque il compito
            resolve({
              ...compito,
              risposta,
            });
          }
        );
      }
    );
  });
};

// Verifica stato compito e presenza risposta per effettuare la valutazione
export const verificaCompitoPerValutazione = (compitoId, docenteId) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT c.stato, 
      EXISTS(SELECT 1 FROM risposte_compiti WHERE compito_id = c.id) as ha_risposta
      FROM compiti c 
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

export const getStatisticheClasse = (docenteId) => {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Prima ottieni tutti gli studenti
      const studenti = await getAllStudents();

      // 2. Per ogni studente, calcola le sue statistiche
      const statistiche = [];

      for (const studente of studenti) {
        const stats = await getStatisticheStudente(studente.id, docenteId);
        statistiche.push({
          id: studente.id,
          nome: studente.nome,
          cognome: studente.cognome,
          aperti: stats.aperti,
          chiusi: stats.chiusi,
          totale: stats.totale,
          media: stats.media,
        });
      }

      resolve(statistiche);
    } catch (error) {
      reject(error);
    }
  });
};

//Ottiene statistiche per uno studente specifico
export const getStatisticheStudente = (studenteId, docenteId) => {
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
            , 2)
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

// Ottiene tutti i compiti di un docente
export const getCompitiDocente = (docenteId) => {
  return new Promise((resolve, reject) => {
    let sql = `
      SELECT 
        c.*,
        u.nome as docente_nome, u.cognome as docente_cognome,
        s.id as studente_id, s.nome as studente_nome, s.cognome as studente_cognome,
        rc.testo_risposta, rc.aggiornato_il as risposta_aggiornato_il, rc.inviato_da as risposta_inviato_da,
        ur.nome as risposta_nome, ur.cognome as risposta_cognome
      FROM compiti c
      JOIN utenti u ON c.creato_da = u.id
      LEFT JOIN assegnazioni_compiti ac ON c.id = ac.compito_id
      LEFT JOIN utenti s ON ac.studente_id = s.id
      LEFT JOIN risposte_compiti rc ON c.id = rc.compito_id
      LEFT JOIN utenti ur ON rc.inviato_da = ur.id
      WHERE c.creato_da = ?
      ORDER BY c.creato_il DESC
    `;

    db.all(sql, [docenteId], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      // Raggruppa i risultati per compito
      const compitiMap = new Map();

      rows.forEach(row => {
        const compitoId = row.id;
        
        if (!compitiMap.has(compitoId)) {
          // Crea il nuovo compito
          compitiMap.set(compitoId, {
            id: row.id,
            traccia: row.traccia,
            stato: row.stato,
            numero_studenti: row.numero_studenti,
            punteggio: row.punteggio,
            creato_il: row.creato_il,
            chiuso_il: row.chiuso_il,
            risposta: row.testo_risposta ? {
              testo: row.testo_risposta,
              aggiornato_il: row.risposta_aggiornato_il,
              inviato_da: row.risposta_inviato_da ? {
                id: row.risposta_inviato_da,
                nome: row.risposta_nome,
                cognome: row.risposta_cognome
              } : null
            } : null,
            docente: {
              id: docenteId,
              nome: row.docente_nome,
              cognome: row.docente_cognome
            },
            gruppo: []
          });
        }

        // Aggiungi lo studente al gruppo se presente
        if (row.studente_id) {
          const compito = compitiMap.get(compitoId);
          compito.gruppo.push({
            id: row.studente_id,
            nome: row.studente_nome,
            cognome: row.studente_cognome
          });
        }
      });

      // Converti la Map in array
      const compiti = Array.from(compitiMap.values());
      resolve(compiti);
    });
  });
};
