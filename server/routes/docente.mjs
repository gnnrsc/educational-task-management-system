import { body, param, query } from "express-validator";
import * as dao from "../dao/docente-dao.mjs";
import * as daoComune from "../dao/dao.mjs";
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
    const studenti = await dao.ottieniListaStudenti();
    res.json(studenti);
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
    body("studentiIds")
      .isArray({ min: 2, max: 6 })
      .withMessage("Il numero di studenti deve essere da 2 a 6"),
    body("studentiIds.*")
      .isInt({ min: 1 })
      .withMessage("Gli ID degli studenti devono essere numeri interi positivi")
      .toInt(),
  ],
  handleValidationErrors,
  async (req, res) => {
    const { traccia, studentiIds } = req.body;
    const creatoDa = req.user.id;

    try {
      const checkRisultato = await dao.checkLimiteCoppiaStudenti(
        studentiIds,
        creatoDa,
        2
      );

      if (!checkRisultato.allowed) {
        const [s1, s2] = checkRisultato.coppia;
        return res.status(400).json({
          error: `Gli studenti ${s1} e ${s2} hanno già collaborato ${checkRisultato.count} volte, limite superato.`,
        });
      }

      const risultato = await dao.creaCompito(traccia, studentiIds, creatoDa);
      res.status(201).json(risultato);
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

      const coppie = await dao.ottieniCollaborazioniStudenti(docenteId, minCount);

      res.json({
        docenteId,
        minCount,
        collaborazioni: coppie,
      });
    } catch (error) {
      console.error("Errore GET collaborazioni studenti:", error);
      res.status(500).json({ error: "Errore nel recupero delle collaborazioni" });
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

      res.json(punteggio);
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

      const studenti = await dao.ottieniStatisticheClasse(docenteId);

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
router.get("/compiti", async (req, res) => {
  try {
    const docenteId = req.user.id;
    const compiti = await dao.ottieniCompitiDocente(docenteId);

    res.json({
      totale: compiti.length,
      compiti: compiti.map((compito) => ({
        id: compito.id,
        traccia: compito.traccia,
        stato: compito.stato,
        creato_il: compito.creato_il,
        chiuso_il: compito.chiuso_il || null,
        numero_studenti: compito.numero_studenti,
        gruppo: compito.gruppo,
        ha_risposta: compito.ha_risposta || null,
        punteggio: compito.punteggio || null,
      })),
    });
  } catch (error) {
    console.error("Errore GET compiti docente:", error);
    res.status(500).json({ error: "Errore server" });
  }
});

// GET: /compiti/:id - Visualizza il dettaglio di un compito (solo per docente)
router.get(
  "/compiti/:id",
  [param("id").isInt({ min: 1 }).withMessage("ID compito non valido")],
  handleValidationErrors,
  async (req, res) => {
    try {
      const compitoId = parseInt(req.params.id);
      const utenteID = req.user.id;

      const compito = await daoComune.ottieniCompito(compitoId);

      if (!compito) {
        return res.status(404).json({ error: "Compito non trovato" });
      }

      if (compito.creato_da !== utenteID) {
        return res.status(403).json({
          error: "Non sei autorizzato a visualizzare questo compito",
        });
      }

      res.json(compito);
      
    } catch (error) {
      console.error("Errore GET dettaglio compito docente:", error);
      res.status(500).json({ error: "Errore server" });
    }
  }
);

// GET: /compiti/:id/valutazione - Ottenere i dati del compito per la valutazione (solo per docenti)
router.get(
  "/compiti/:id/valutazione",
  [param("id").isInt({ min: 1 }).withMessage("ID compito non valido")],
  handleValidationErrors,
  async (req, res) => {
    try {
      const compitoId = parseInt(req.params.id);
      const docenteId = req.user.id;

      const compito = await dao.ottieniDettaglioCompitoValutazione(compitoId, docenteId);

      if (!compito) {
        return res.status(404).json({ error: "Compito non trovato" });
      }

      res.json(compito);
      
    } catch (error) {
      console.error("Errore GET compito per valutazione:", error);
      res.status(500).json({ error: "Errore server" });
    }
  }
);


export default router;
