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

// Ottiene il dettaglio completo di un compito con i membri del gruppo e la risposta
export const ottieniCompito = async (compitoId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        c.*, 
        u.nome as docente_nome, u.cognome as docente_cognome,
        rc.testo_risposta, rc.aggiornato_il as risposta_aggiornata_il,
        rc.inviato_da as risposta_inviato_da,
        ur.nome as risposta_nome, ur.cognome as risposta_cognome,
        us.id as studente_id, us.nome as studente_nome, us.cognome as studente_cognome
      FROM compiti c
      JOIN utenti u ON c.creato_da = u.id
      LEFT JOIN risposte_compiti rc ON c.id = rc.compito_id
      LEFT JOIN utenti ur ON rc.inviato_da = ur.id
      LEFT JOIN assegnazioni_compiti ac ON c.id = ac.compito_id
      LEFT JOIN utenti us ON ac.studente_id = us.id
      WHERE c.id = ?
      ORDER BY us.cognome, us.nome
    `;

    /*
    esempio:
id | traccia                  | creato_da | stato  | numero_studenti | punteggio | creato_il           | chiuso_il           | docente_nome | docente_cognome | testo_risposta                   | risposta_aggiornata_il | risposta_inviato_da | risposta_nome | risposta_cognome | studente_id | studente_nome | studente_cognome
---|--------------------------|-----------|--------|-----------------|-----------|---------------------|---------------------|--------------|-----------------|----------------------------------|------------------------|---------------------|---------------|------------------|-------------|---------------|------------------
2  | Crea una Single Page ... | 1         | chiuso | 2               | 28        | 2025-05-30 10:00:00 | 2025-06-07 10:00:00 | Luigi        | De Russis       | La SPA è un'applicazione web ... | 2025-06-01 15:00:00    | 4                   | Marco         | Bianchi          | 4           | Marco         | Bianchi
2  | Crea una Single Page ... | 1         | chiuso | 2               | 28        | 2025-05-30 10:00:00 | 2025-06-07 10:00:00 | Luigi        | De Russis       | La SPA è un'applicazione web ... | 2025-06-01 15:00:00    | 4                   | Marco         | Bianchi          | 3           | Alice         | Rossi
    
*/

    db.all(sql, [compitoId], (err, rows) => {
      if (err) return reject(err);
      if (!rows || rows.length === 0) return resolve(null);

      //una riga per ogni componente del gruppo, ma i dati del compito sono gli stessi
      const compito = rows[0]; // I dati del compito sono gli stessi in tutte le righe
      
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
        gruppo: rows
          .filter(row => row.studente_id) // Filtra eventuali null (non ci dovrebbero essere)
          .map(row => ({
            id: row.studente_id,
            nome: row.studente_nome,
            cognome: row.studente_cognome,
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
    });
  });
};

export default db;
