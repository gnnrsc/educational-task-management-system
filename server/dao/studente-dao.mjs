import dayjs from "dayjs";
import db from "..//dao/dao.mjs";

//STUDENTE DAO

// Recupera la risposta di un compito (con dettagli di chi l'ha inviata)
export const getRispostaCompito = (compitoId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT rc.testo_risposta, rc.aggiornato_il, rc.inviato_da,
             u.nome as inviato_da_nome, u.cognome as inviato_da_cognome
      FROM risposte_compiti rc
      JOIN utenti u ON rc.inviato_da = u.id
      WHERE rc.compito_id = ?
    `;

    db.get(sql, [compitoId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Inserisce o aggiorna la risposta di un compito
export const updateRispostaCompito = (compitoId, testoRisposta, studenteId) => {
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
            else resolve({ changes: this.changes });
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
            else resolve({ id: this.lastID });
          }
        );
      }
    });
  });
};

// Ottiene tutti i compiti assegnati a uno studente con filtro opzionale
export const getCompitiStudente = (studenteId, stato = null) => {
  return new Promise((resolve, reject) => {
    let sql = `
      SELECT c.*, u.nome as docente_nome, u.cognome as docente_cognome,
             rc.testo_risposta,
             GROUP_CONCAT(us.nome || ' ' || us.cognome, ', ') as gruppo
      FROM assegnazioni_compiti ac
      JOIN compiti c ON ac.compito_id = c.id
      JOIN utenti u ON c.creato_da = u.id
      LEFT JOIN risposte_compiti rc ON c.id = rc.compito_id
      LEFT JOIN assegnazioni_compiti ac2 ON ac2.compito_id = c.id
      LEFT JOIN utenti us ON ac2.studente_id = us.id
      WHERE ac.studente_id = ?
    `;

    const params = [studenteId];

    if (stato) {
      sql += ` AND c.stato = ?`;
      params.push(stato);
    }

    sql += ` 
      GROUP BY c.id, u.nome, u.cognome, rc.testo_risposta
      ORDER BY c.creato_il DESC
    `;

    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Ottiene la media ponderata di uno studente
export const getMediaPonderataStudente = (studenteId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT AVG(CAST(c.punteggio AS REAL) / c.numero_studenti) as media
      FROM assegnazioni_compiti ac
      JOIN compiti c ON ac.compito_id = c.id
      WHERE ac.studente_id = ? 
      AND c.stato = 'chiuso' 
      AND c.punteggio IS NOT NULL
    `;

    db.get(sql, [studenteId], (err, row) => {
      if (err) reject(err);
      else resolve(row?.media || null);
    });
  });
};

// Ottiene il numero di compiti chiusi/valutati di uno studente
export const getNumeroCompitiChiusiStudente = (studenteId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT COUNT(*) as count
      FROM assegnazioni_compiti ac
      JOIN compiti c ON ac.compito_id = c.id
      WHERE ac.studente_id = ? AND c.stato = 'chiuso'
    `;

    db.get(sql, [studenteId], (err, row) => {
      if (err) reject(err);
      else resolve(row.count || 0);
    });
  });
};

// Recupera un compito per ID (base, senza controlli di autorizzazione)
export const getCompitoById = (compitoId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT c.*, u.nome as docente_nome, u.cognome as docente_cognome
      FROM compiti c
      JOIN utenti u ON c.creato_da = u.id
      WHERE c.id = ?
    `;

    db.get(sql, [compitoId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Verifica se uno studente fa parte del gruppo di un compito
export const isStudentInGroup = (compitoId, studenteId) => {
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
