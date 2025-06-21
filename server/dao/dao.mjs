import sqlite3 from "sqlite3";
import crypto from "crypto";
import dayjs from 'dayjs';

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

export default db;