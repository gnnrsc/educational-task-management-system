import { body, param, query } from "express-validator";
import * as dao from "../dao/docente-dao.mjs";
import * as daoCommon from "../dao/dao.mjs";
import { validationResult } from "express-validator";
import express from "express";
const router = express.Router();

//ROUTE DOCENTE

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

// GET: /classe - Ottenere lista studenti (solo per docenti)
router.get("/classe", async (req, res) => {
  try {
    const students = await dao.getAllStudents();
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: "Errore nel recupero degli studenti" });
  }
});

// POST: /compiti - Creare un nuovo compito (solo per docenti)
router.post(
  "/compiti",
  [
    body("traccia")
      .isLength({ min: 1})
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

// GET: /classe/collaborazioni - Ottenere coppie di studenti con collaborazioni >= minCount (default: 2)
router.get(
  "/classe/collaborazioni",
  [
    query("minCount")
      .optional()
      .isInt({ min: 1 })
      .withMessage("minCount deve essere un intero >= 1")
      .toInt(),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const docenteId = req.user.id;
      const minCount = req.query.minCount || 2;

      const pairs = await dao.getStudentPairsCollaborations(docenteId, minCount);

      res.json({
        docenteId,
        minCount,
        collaborazioni: pairs,
      });
    } catch (error) {
      console.error("Errore GET collaborazioni studenti:", error);
      res.status(500).json({ error: "Errore nel recupero delle collaborazioni" });
    }
  }
);


// GET: /compiti/:id/risposta - Ottenere la risposta di un compito (solo per docenti)
router.get(
  "/compiti/:id/risposta",
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

// PUT: /compiti/:id/valutazione - Effettuare una valutazione di un compito (solo per docenti)
router.put(
  "/compiti/:id/valutazione",
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

// GET: /classe/stato - Ottenere statistiche della classe (solo per docenti)
router.get(
  "/classe/stato",
  [
    query("sort")
      .optional()
      .isIn(["media", "alfabetico", "totale"])
      .withMessage(
        "Ordinamento non valido. Valori accettati: media, alfabetico, totale"
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
        totale: (a, b) =>
          b.totale - a.totale || a.cognome.localeCompare(b.cognome),
        media: (a, b) =>
          (b.media || 0) - (a.media || 0) || a.cognome.localeCompare(b.cognome),
      };

      studenti.sort(sortFunctions[sort]);

      res.json({
        ordinamento: sort,
        studenti: studenti.map((s) => ({
          studente: {
            id: s.id,
            nome: s.nome,
            cognome: s.cognome,
          },
          totale_compiti: s.totale,
          compiti_aperti: s.aperti,
          compiti_chiusi: s.chiusi,
          media: s.media,
        })),
      });
    } catch (error) {
      console.error("Errore GET stato classe:", error);
      res.status(500).json({ error: "Errore server" });
    }
  }
);

// GET: /compiti - Visualizza tutti i compiti creati dal docente con filtro opzionale
router.get(
  "/compiti",
  [
    query("stato")
      .optional()
      .isIn(["aperto", "chiuso"])
      .withMessage("Stato non valido. Valori accettati: aperto, chiuso"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const docenteId = req.user.id;
      const { stato } = req.query;

      const compiti = await dao.getCompitiDocente(docenteId, stato);

      res.json({
        filtro: stato || "tutti",
        totale: compiti.length,
        compiti: compiti.map((compito) => ({
          id: compito.id,
          traccia: compito.traccia,
          stato: compito.stato,
          creato_il: compito.creato_il,
          chiuso_il: compito.chiuso_il || null,
          numero_studenti: compito.numero_studenti,
          gruppo: compito.gruppo,
          ha_risposta: compito.testo_risposta ? true : false,
          punteggio: compito.punteggio || null,
        })),
      });
    } catch (error) {
      console.error("Errore GET compiti docente:", error);
      res.status(500).json({ error: "Errore server" });
    }
  }
);

// GET: /compiti/:id - Visualizza il dettaglio di un compito (solo per docente)
router.get(
  "/compiti/:id",
  [param("id").isInt({ min: 1 }).withMessage("ID compito non valido")],
  handleValidationErrors,
  async (req, res) => {
    try {
      const compitoId = parseInt(req.params.id);
      const userId = req.user.id;

      const compito = await daoCommon.getCompitoConGruppo(compitoId);

      if (!compito) {
        return res.status(404).json({ error: "Compito non trovato" });
      }

      // Il docente può vedere solo i propri compiti
      if (compito.creato_da !== userId) {
        return res.status(403).json({
          error: "Non sei autorizzato a visualizzare questo compito",
        });
      }

      // Costruisci oggetto risposta nel formato desiderato
      const risposta = compito.risposta
        ? {
            testo: compito.risposta.testo_risposta,
            aggiornato_il: compito.risposta.aggiornato_il,
            inviato_da: {
              id: compito.risposta.inviato_da,
              nome: compito.risposta.inviato_da_nome,
              cognome: compito.risposta.inviato_da_cognome,
            },
          }
        : undefined;

      res.json({
        id: compito.id,
        traccia: compito.traccia,
        stato: compito.stato,
        creato_il: compito.creato_il,
        chiuso_il: compito.chiuso_il || null,
        punteggio: compito.punteggio ?? null,
        numero_studenti: compito.numero_studenti,
        gruppo: compito.gruppo.map((studente) => ({
          id: studente.id,
          nome: studente.nome,
          cognome: studente.cognome,
        })),
        risposta,
      });
    } catch (error) {
      console.error("Errore GET dettaglio compito docente:", error);
      res.status(500).json({ error: "Errore server" });
    }
  }
);


export default router;
