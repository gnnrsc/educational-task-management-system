import sqlite3 from "sqlite3";
import crypto from "crypto";

//DAO COMUNE

// Inizializzazione database
const db = new sqlite3.Database("compiti.sqlite", (err) => {
  if (err) {
    console.error("Errore apertura database:", err.message);
    throw err;
  }
  console.log("Connesso al database SQLite.");
});

/*UTENTI*/

// Funzione di login: verifica email e password
export const ottieniUtente = (email, password) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM utenti WHERE email = ?";
    db.get(sql, [email], (err, row) => {
      if (err) return reject(err);
      if (!row) return resolve(false);

      crypto.scrypt(password, row.salt, 32, (err, hashedPassword) => {
        if (err) return reject(err);

        const storedPassword = Buffer.from(row.password, "hex");
        if (!crypto.timingSafeEqual(storedPassword, hashedPassword)) {
          return resolve(false);
        }

        const user = {
          id: row.id,
          email: row.email,
          nome: row.nome,
          cognome: row.cognome,
          ruolo: row.ruolo,
        };
        resolve(user);
      });
    });
  });
};

// Funzione per ottenere un utente dato il suo ID
export const ottieniUtentePerId = (id) => {
  return new Promise((resolve, reject) => {
    const sql =
      "SELECT id, email, nome, cognome, ruolo FROM utenti WHERE id = ?";
    db.get(sql, [id], (err, row) => {
      if (err) {
        reject(err);
      } else if (!row) {
        resolve(null);
      } else {
        const user = {
          id: row.id,
          email: row.email,
          nome: row.nome,
          cognome: row.cognome,
          ruolo: row.ruolo,
        };
        resolve(user);
      }
    });
  });
};

// Funzioni comuni tra studenti e docenti per ottenere il compito

// Ottiene il dettaglio completo di un compito con i membri del gruppo
export const ottieniCompitoConGruppo = async (compitoId) => {
  return new Promise((resolve, reject) => {
    const sqlCompito = `
      SELECT c.*, u.nome as docente_nome, u.cognome as docente_cognome,
             rc.testo_risposta, rc.aggiornato_il as risposta_aggiornata_il,
             rc.inviato_da as risposta_inviato_da,
             ur.nome as risposta_nome, ur.cognome as risposta_cognome
      FROM compiti c
      JOIN utenti u ON c.creato_da = u.id
      LEFT JOIN risposte_compiti rc ON c.id = rc.compito_id
      LEFT JOIN utenti ur ON rc.inviato_da = ur.id
      WHERE c.id = ?
    `;

    db.get(sqlCompito, [compitoId], async (err, compito) => {
      if (err) return reject(err);
      if (!compito) return resolve(null);

      try {
        const gruppo = await ottieniMembriGruppoCompito(compitoId);

        const result = {
          id: compito.id,
          traccia: compito.traccia,
          stato: compito.stato,
          creato_il: compito.creato_il,
          creato_da: compito.creato_da,
          docente: {
            id: compito.creato_da,
            nome: compito.docente_nome,
            cognome: compito.docente_cognome,
          },
          chiuso_il: compito.chiuso_il || null,
          punteggio: compito.punteggio ?? null,
          numero_studenti: compito.numero_studenti,
          gruppo: gruppo.map(studente => ({
            id: studente.id,
            nome: studente.nome,
            cognome: studente.cognome,
          })),
          risposta: compito.testo_risposta ? {
            testo: compito.testo_risposta,
            aggiornato_il: compito.risposta_aggiornata_il,
            inviato_da: {
              id: compito.risposta_inviato_da,
              nome: compito.risposta_nome,
              cognome: compito.risposta_cognome,
            },
          } : undefined
        };

        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  });
};

// Ottiene i membri del gruppo di un compito
export const ottieniMembriGruppoCompito = (compitoId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT u.id, u.nome, u.cognome
      FROM assegnazioni_compiti ac
      JOIN utenti u ON ac.studente_id = u.id
      WHERE ac.compito_id = ?
      ORDER BY u.cognome, u.nome
    `;
    
    db.all(sql, [compitoId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export default db;
