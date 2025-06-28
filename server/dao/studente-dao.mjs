import dayjs from "dayjs";
import db from "..//dao/dao.mjs";

//STUDENTE DAO

// Inserisce o aggiorna la risposta di un compito
export const aggiornaRispostaCompito = (compitoId, testoRisposta, studenteId) => {
  return new Promise((resolve, reject) => {
    const now = dayjs().format("YYYY-MM-DD HH:mm:ss");

    // Prima controlla se esiste già una risposta
    const checkSql = `SELECT 1 FROM risposte_compiti WHERE compito_id = ?`;

    db.get(checkSql, [compitoId], (err, existing) => {
      if (err) return reject(err);

      if (existing) {
        // Aggiorna risposta esistente
        const updateSql = `
          UPDATE risposte_compiti 
          SET testo_risposta = ?, inviato_da = ?, aggiornato_il = ?
          WHERE compito_id = ?
        `;

        db.run(
          updateSql,
          [testoRisposta, studenteId, now, compitoId],
          function (err) {
            if (err) reject(err);
            else resolve({ changes: this.changes , aggiornato_il: now });
          }
        );
      } else {
        // Inserisce nuova risposta
        const insertSql = `
          INSERT INTO risposte_compiti (compito_id, testo_risposta, inviato_da, aggiornato_il)
          VALUES (?, ?, ?, ?)
        `;

        db.run(
          insertSql,
          [compitoId, testoRisposta, studenteId, now],
          function (err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, aggiornato_il: now });
          }
        );
      }
    });
  });
};

// Ottiene tutti i compiti assegnati a uno studente con filtro opzionale
export const ottieniCompitiStudente = (studenteId, stato = null) => {
  return new Promise((resolve, reject) => {
    let sql = `
      SELECT 
        c.*,
        u.nome as docente_nome, u.cognome as docente_cognome,
        rc.testo_risposta, rc.aggiornato_il as risposta_aggiornato_il, rc.inviato_da as risposta_inviato_da,
        ur.nome as risposta_nome, ur.cognome as risposta_cognome,
        us.id as gruppo_studente_id, us.nome as gruppo_studente_nome, us.cognome as gruppo_studente_cognome
      FROM assegnazioni_compiti ac
      JOIN compiti c ON ac.compito_id = c.id
      JOIN utenti u ON c.creato_da = u.id
      LEFT JOIN risposte_compiti rc ON c.id = rc.compito_id
      LEFT JOIN utenti ur ON rc.inviato_da = ur.id
      LEFT JOIN assegnazioni_compiti ac2 ON ac2.compito_id = c.id
      LEFT JOIN utenti us ON ac2.studente_id = us.id
      WHERE ac.studente_id = ?
    `;
    /*esempio con studente 3:
    # Tabella delle tracce con risposte di gruppo:
# +----+----------------------------+--------+------------------+-----------+---------------------+---------------------+---------------+------------------+ Testo Risp.     | Risp. Aggior.       | Inviato da        | Gruppo Studente     |
# | ID | Traccia                    | Stato  | Numero Studenti  | Punteggio | Creato il           | Chiuso il           | Docente       |                  |                 |                     |                   |                     |
# +----+----------------------------+--------+------------------+-----------+---------------------+---------------------+---------------+------------------+-----------------+---------------------+-------------------+---------------------+
# | 1  | Spiega i principali rich...| aperto | 6                |           | 2025-06-15 12:00:00 |                     | De Russis L.  | Alice Rossi      |                 |                     |                   |                     |
# | 1  | Spiega i principali rich...| aperto | 6                |           | 2025-06-15 12:00:00 |                     | De Russis L.  | Marco Bianchi    |                 |                     |                   |                     |
# | 1  | Spiega i principali rich...| aperto | 6                |           | 2025-06-15 12:00:00 |                     | De Russis L.  | Giulia Verdi     |                 |                     |                   |                     |
# | 1  | Spiega i principali rich...| aperto | 6                |           | 2025-06-15 12:00:00 |                     | De Russis L.  | Andrea Neri      |                 |                     |                   |                     |
# | 1  | Spiega i principali rich...| aperto | 6                |           | 2025-06-15 12:00:00 |                     | De Russis L.  | Francesca Gialli |                 |                     |                   |                     |
# | 1  | Spiega i principali rich...| aperto | 6                |           | 2025-06-15 12:00:00 |                     | De Russis L.  | Simone Mazza     |                 |                     |                   |                     |
# | 2  | Crea una SPA con React...  | chiuso | 2                | 28        | 2025-05-30 10:00:00 | 2025-06-07 10:00:00 | De Russis L.  | Alice Rossi      | La SPA è un'a...| 2025-06-01 15:00:00 | Marco Bianchi     |                     |
# | 2  | Crea una SPA con React...  | chiuso | 2                | 28        | 2025-05-30 10:00:00 | 2025-06-07 10:00:00 | De Russis L.  | Marco Bianchi    | La SPA è un'a...| 2025-06-01 15:00:00 | Marco Bianchi     |                     |
# +----+----------------------------+--------+------------------+-----------+---------------------+---------------------+---------------+------------------+-----------------+---------------------+-------------------+---------------------+

    */

    const params = [studenteId];

    if (stato) {
      sql += ` AND c.stato = ?`;
      params.push(stato);
    }

    sql += ` ORDER BY c.creato_il DESC`;

    db.all(sql, params, (err, rows) => {
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
              id: row.creato_da,
              nome: row.docente_nome,
              cognome: row.docente_cognome
            },
            gruppo: []
          });
        }

        // Aggiungi lo studente al gruppo se presente
        if (row.gruppo_studente_id) {
          const compito = compitiMap.get(compitoId);
          // Evita duplicati nel gruppo
          const esisteGia = compito.gruppo.some(s => s.id === row.gruppo_studente_id);
          if (!esisteGia) {
            compito.gruppo.push({
              id: row.gruppo_studente_id,
              nome: row.gruppo_studente_nome,
              cognome: row.gruppo_studente_cognome
            });
          }
        }
      });

      // Converti la Map in array
      const compiti = Array.from(compitiMap.values());
      resolve(compiti);
    });
  });
};

 // Ottiene la media ponderata di uno studente
export const ottieniMediaStudente = (studenteId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        CASE 
          WHEN SUM(1.0 / c.numero_studenti) > 0 THEN
            ROUND(
              SUM(c.punteggio * (1.0 / c.numero_studenti)) /
              SUM(1.0 / c.numero_studenti),
            3)
          ELSE NULL
        END AS media,
        COUNT(*) AS totale_compiti
      FROM assegnazioni_compiti ac
      JOIN compiti c ON ac.compito_id = c.id
      WHERE ac.studente_id = ?
      AND c.stato = 'chiuso'
      AND c.punteggio IS NOT NULL
    `;
    //Media = Somma(punteggio_individuale) / Somma(pesi)
    // pesi = 1 / numero_studenti
    db.get(sql, [studenteId], (err, row) => {
      if (err) reject(err);
      else resolve({
        media: row?.media ?? null,
        totale_compiti: row?.totale_compiti ?? 0
      });
    });
  });
};


// Verifica se uno studente fa parte del gruppo di un compito
export const checkStudenteGruppo = (compitoId, studenteId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 1 FROM assegnazioni_compiti 
      WHERE compito_id = ? AND studente_id = ?
    `;

    db.get(sql, [compitoId, studenteId], (err, row) => {
      if (err) reject(err);
      else resolve(!!row);
    });
  });
};
