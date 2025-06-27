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
export const getCompitiStudente = (studenteId, stato = null) => {
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

// Ottiene la media (ponderata o no) di uno studente
export const getMediaStudente = (studenteId) => {
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
