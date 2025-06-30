import express from "express";
import cors from "cors";
import morgan from "morgan";
import session from "express-session";
import passport from "passport";
import LocalStrategy from "passport-local";
import * as dao from "./dao/dao.mjs";
import docenteRoutes from "./routes/docente.mjs";
import studenteRoutes from "./routes/studente.mjs";

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
    const user = await dao.ottieniUtente(email, password);
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
    const user = await dao.ottieniUtentePerId(id);
    cb(null, user);
  } catch (err) {
    cb(err);
  }
});

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

// ROUTES DOCENTE
app.use("/api/docente", isLoggedIn, isTeacher, docenteRoutes);

// ROUTES STUDENTE
app.use("/api/studente", isLoggedIn, isStudent, studenteRoutes);

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

export default app;
