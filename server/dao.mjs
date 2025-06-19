import sqlite3 from "sqlite3";
import crypto from "crypto";

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

// Ottieni tutti gli studenti (ruolo = studente)
export const getAllStudents = () => {
  return new Promise((resolve, reject) => {
    const sql =
      'SELECT id, email, nome, cognome FROM utenti WHERE ruolo = "studente" ORDER BY id';
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Funzione per creare un nuovo compito ed assegnarlo agli studenti
export const createTask = (traccia, studentIds, creatoDa) => {
  return new Promise((resolve, reject) => {
    const sql = "INSERT INTO compiti (traccia, creato_da) VALUES (?, ?)";
    db.run(sql, [traccia, creatoDa], function (err) {
      if (err) return reject(err);
      const compitoId = this.lastID;

      assegnaStudenti(compitoId, studentIds)
        .then(() => {
          // Lancia aggiornaCollaborazioni senza aspettarla
          aggiornaCollaborazioni(studentIds, creatoDa).catch((err) => {
            console.error("Errore aggiornamento collaborazioni:", err);
          });
          // Risolvi subito, senza aspettare aggiornaCollaborazioni
          resolve(compitoId);
        })
        .catch(reject);
    });
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

export const checkStudentPairLimit = async (studentIds, docenteId, minLimit = 2) => {
  const collaborations = await getStudentPairsCollaborations(docenteId, minLimit);

  const pairKey = (id1, id2) => (id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`);

  for (let i = 0; i < studentIds.length; i++) {
    for (let j = i + 1; j < studentIds.length; j++) {
      const key = pairKey(studentIds[i], studentIds[j]);
      if (collaborations[key]) {
        return {
          allowed: false,
          pair: [studentIds[i], studentIds[j]],
          count: collaborations[key],
        };
      }
    }
  }

  return { allowed: true };
};


