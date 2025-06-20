import express from "express";
import cors from "cors";
import morgan from "morgan";
import session from "express-session";
import passport from "passport";
import LocalStrategy from "passport-local";
import { body, param, query, validationResult } from "express-validator";
import * as dao from "./dao.mjs";

const app = express();
const PORT = 3001;

// Setup del Middleware
app.use(morgan("dev")); // per il logging delle richieste HTTP
app.use(express.json());

// Configurazione CORS
app.use(
  cors({
    origin: "http://localhost:5173",
    optionsSuccessStatus: 200,
    credentials: true, //accetta cookie di sessione esterni per autenticazione
  })
);

// Configurazione di Passport.js per l'autenticazione
passport.use(
  new LocalStrategy({ usernameField: "email" }, async function verify(
    email,
    password,
    cb
  ) {
    const user = await dao.getUser(email, password);
    if (!user) return cb(null, false, "Incorrect email or password.");

    return cb(null, user);
  })
);

// Serializzazione e deserializzazione dell'utente per le sessioni
passport.serializeUser(function (user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(async function (id, cb) {
  try {
    const user = await dao.getUserById(id);
    cb(null, user);
  } catch (err) {
    cb(err);
  }
});

// Middleware per gestire gli errori di validazione
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Dati non validi",
      details: errors.array(),
    });
  }
  next();
};

// Middleware per verificare se l'utente è autenticato
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: "Non autorizzato" });
};

// Middleware per verificare il ruolo (docente)
export const isTeacher = (req, res, next) => {
  if (req.isAuthenticated() && req.user.ruolo === "docente") {
    return next();
  }
  return res.status(403).json({
    error: "Accesso riservato ai docenti",
  });
};

// Middleware per verificare il ruolo (studente)
export const isStudent = (req, res, next) => {
  if (req.isAuthenticated() && req.user.ruolo === "studente") {
    return next();
  }
  return res.status(403).json({
    error: "Accesso riservato agli studenti",
  });
};

// Configurazione della sessione
app.use(
  session({
    secret: "shhhhh...la risposta al compito è un segreto!",
    resave: false,
    saveUninitialized: false,
  })
);
// Inizializzazione di Passport.js per usare le sessioni
app.use(passport.authenticate("session"));

/* ROUTES */

//SESSION

// POST: api/sessions - LOGIN
app.post("/api/sessions", function (req, res, next) {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json(info);
    }
    req.login(user, (err) => {
      if (err) return next(err);
      return res.json(req.user);
    });
  })(req, res, next);
});

// DELETE: api/sessions/current - LOGOUT
app.delete("/api/sessions/current", isLoggedIn, (req, res) => {
  req.logout(() => {
    res.end();
  });
});

// GET: api/sessions/current - OTTENERE SESSIONE ATTUALE
app.get("/api/sessions/current", (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json(req.user);
  } else {
    res.status(401).json({ error: "Utente non autenticato!" });
  }
});

// ROUTE PROTETTE

//DOCENTE

// GET: /api/classe - Ottenere lista studenti (solo per docenti)
app.get("/api/classe", isLoggedIn, isTeacher, async (req, res) => {
  try {
    const students = await dao.getAllStudents();
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: "Errore nel recupero degli studenti" });
  }
});

// POST: /api/compiti - Creare un nuovo compito (solo per docenti)
app.post(
  "/api/compiti",
  isLoggedIn,
  isTeacher,
  [
    body("traccia")
      .isLength({ min: 10 })
      .withMessage("La traccia è obbligatoria"),
    body("studentIds")
      .isArray({ min: 2, max: 6 })
      .withMessage("Il numero di studenti deve essere da 2 a 6"),
    body("studentIds.*")
      .isInt({ min: 1 })
      .withMessage("Gli ID degli studenti devono essere numeri interi positivi")
      .toInt(),
  ],
  handleValidationErrors,
  async (req, res) => {
    const { traccia, studentIds } = req.body;
    const creatoDa = req.user.id;

    try {
      const checkResult = await dao.checkStudentPairLimit(
        studentIds,
        creatoDa,
        2
      );

      if (!checkResult.allowed) {
        const [s1, s2] = checkResult.pair;
        return res.status(400).json({
          error: `Gli studenti ${s1} e ${s2} hanno già collaborato ${checkResult.count} volte, limite superato.`,
        });
      }

      const compitoId = await dao.createTask(traccia, studentIds, creatoDa);
      res.status(201).json({ id: compitoId });
    } catch (error) {
      console.error("Errore creazione compito:", error);
      res.status(500).json({ error: "Errore nella creazione del compito" });
    }
  }
);

// GET: /api/compiti/:id/risposta - Ottenere la risposta di un compito (solo per docenti)
app.get(
  "/api/compiti/:id/risposta",
  isLoggedIn,
  isTeacher,
  [param("id").isInt({ min: 1 }).withMessage("ID compito non valido").toInt()],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id: compitoId } = req.params;
      const docenteId = req.user.id;

      const risultato = await dao.getRispostaCompito(compitoId, docenteId);

      if (!risultato) {
        return res
          .status(404)
          .json({ error: "Compito non trovato o non accessibile" });
      }

      const response = {
        id: risultato.id,
        traccia: risultato.traccia,
        stato: risultato.stato,
        numero_studenti: risultato.numero_studenti,
        punteggio: risultato.punteggio,
      };

      if (!risultato.risposta || !risultato.risposta.testo_risposta) {
        // Compito esiste, ma non ha risposta
        return res
          .status(204)
          .json({ message: "Nessuna risposta disponibile per questo compito" });
      }

      // Risposta presente
      response.risposta = {
        testo: risultato.risposta.testo_risposta,
        aggiornato_il: risultato.risposta.aggiornato_il,
        inviato_da: `${risultato.risposta.risposta_nome} ${risultato.risposta.risposta_cognome}`,
      };

      res.json(response);
    } catch (error) {
      console.error("Errore GET risposta:", error);
      res.status(500).json({ error: "Errore server" });
    }
  }
);

// PUT: /api/compiti/:id/valutazione - Effettuare una valutazione di un compito (solo per docenti)
app.put(
  "/api/compiti/:id/valutazione",
  isLoggedIn,
  isTeacher,
  [
    param("id").isInt({ min: 1 }).withMessage("ID compito non valido").toInt(),
    body("punteggio")
      .isInt({ min: 0, max: 30 })
      .withMessage("Punteggio deve essere intero tra 0-30")
      .toInt(),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id: compitoId } = req.params;
      const { punteggio } = req.body;
      const docenteId = req.user.id;

      const compito = await dao.verificaCompitoPerValutazione(
        compitoId,
        docenteId
      );

      if (!compito) {
        return res.status(404).json({ error: "Compito non trovato" });
      }

      if (compito.stato !== "aperto") {
        return res.status(400).json({ error: "Compito già chiuso" });
      }

      if (!compito.ha_risposta) {
        return res.status(400).json({ error: "Nessuna risposta da valutare" });
      }

      await dao.valutaEChiudiCompito(compitoId, punteggio);

      res.json({ message: "Compito valutato", punteggio });
    } catch (error) {
      console.error("Errore PUT valutazione:", error);
      res.status(500).json({ error: "Errore server" });
    }
  }
);

// GET: /api/classe/stato - Ottenere statistiche della classe (solo per docenti)
app.get(
  "/api/classe/stato",
  isLoggedIn,
  isTeacher,
  [
    query("sort")
      .optional()
      .isIn(["media_punteggi", "alfabetico", "totale_compiti"])
      .withMessage(
        "Ordinamento non valido. Valori accettati: media_punteggi, alfabetico, totale_compiti"
      ),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { sort = "alfabetico" } = req.query;
      const docenteId = req.user.id;

      const studenti = await dao.getStatisticheClasse(docenteId);

      // Ordinamento
      const sortFunctions = {
        alfabetico: (a, b) =>
          a.cognome.localeCompare(b.cognome) || a.nome.localeCompare(b.nome),
        totale_compiti: (a, b) =>
          b.totale - a.totale || a.cognome.localeCompare(b.cognome),
        media_punteggi: (a, b) =>
          (b.media || 0) - (a.media || 0) || a.cognome.localeCompare(b.cognome),
      };

      studenti.sort(sortFunctions[sort]);

      res.json({
        ordinamento: sort,
        studenti: studenti.map((s) => ({
          nome: s.nome,
          cognome: s.cognome,
          compiti_aperti: s.aperti,
          compiti_chiusi: s.chiusi,
          totale_compiti: s.totale,
          media_punteggi: s.media,
        })),
      });
    } catch (error) {
      console.error("Errore GET stato classe:", error);
      res.status(500).json({ error: "Errore server" });
    }
  }
);

// Gestione errori 404
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint non trovato" });
});

// Gestione errori generali
app.use((err, req, res, next) => {
  console.error("Errore server:", err);
  res.status(500).json({ error: "Errore interno del server" });
});
// attivazione del server
app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
