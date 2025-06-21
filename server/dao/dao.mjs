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

/*USERS*/

// Funzione di login: verifica email e password
export const getUser = (email, password) => {
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
export const getUserById = (id) => {
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

// Funzione comune tra studenti e docenti per ottenere il compiti

// Ottiene il dettaglio completo di un compito con i membri del gruppo
export const getCompitoConGruppo = async (compitoId) => {
  return new Promise((resolve, reject) => {
    // Query per dati base del compito + risposta
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
        // Utilizza la funzione esistente per ottenere i membri del gruppo
        const gruppo = await getMembriGruppoCompito(compitoId);

        // Struttura la risposta se presente
        const risposta = compito.testo_risposta ? {
          testo_risposta: compito.testo_risposta,
          aggiornato_il: compito.risposta_aggiornata_il,
          inviato_da: compito.risposta_inviato_da,
          inviato_da_nome: compito.risposta_nome,
          inviato_da_cognome: compito.risposta_cognome
        } : null;

        // Rimuovi i campi della risposta dall'oggetto principale
        const { 
          testo_risposta, 
          risposta_aggiornata_il, 
          risposta_inviato_da,
          risposta_nome,
          risposta_cognome,
          ...compitoBase 
        } = compito;

        resolve({
          ...compitoBase,
          gruppo,
          risposta
        });
      } catch (error) {
        reject(error);
      }
    });
  });
};

// Ottiene i membri del gruppo di un compito
export const getMembriGruppoCompito = (compitoId) => {
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
