import { body, param, query } from "express-validator";
import * as dao from "../dao/studente-dao.mjs";
import * as daoComune from "../dao/dao.mjs";
import { validationResult } from "express-validator";
import express from "express";
const router = express.Router();

//ROUTE STUDENTE

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

// GET: /compiti - Visualizza tutti i compiti dello studente con filtro opzionale
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
      const studenteId = req.user.id;
      const { stato } = req.query;

      const compiti = await dao.ottieniCompitiStudente(studenteId, stato);

      res.json({
        filtro: stato || "tutti",
        totale: compiti.length,
        compiti: compiti.map((compito) => ({
          id: compito.id,
          traccia: compito.traccia,
          stato: compito.stato,
          creato_il: compito.creato_il,
          chiuso_il: compito.chiuso_il || null,
          docente: compito.docente,
          gruppo: compito.gruppo,
          ha_risposta: compito.ha_risposta,
          punteggio: compito.punteggio || null,
          numero_studenti: compito.numero_studenti,
        })),
      });
    } catch (error) {
      console.error("Errore GET compiti studente:", error);
      res.status(500).json({ error: "Errore server" });
    }
  }
);

// PUT: /compiti/:id/rispondi - Inserisce o aggiorna la risposta a un compito
router.put(
  "/compiti/:id/rispondi",
  [
    param("id").isInt({ min: 1 }).withMessage("ID compito non valido"),
    body("testo_risposta")
      .isString()
      .isLength({ min: 1 })
      .withMessage("La risposta deve essere una stringa non vuota"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const compitoId = parseInt(req.params.id);
      const { testo_risposta } = req.body;
      const studenteId = req.user.id;

      // Verifica che il compito esista e sia aperto
      const compito = await daoComune.ottieniCompito(compitoId);
      if (!compito) {
        return res.status(404).json({ error: "Compito non trovato" });
      }

      if (compito.stato !== "aperto") {
        return res
          .status(400)
          .json({
            error: "Il compito è già chiuso e non può essere modificato",
          });
      }

      // Verifica che lo studente sia parte del gruppo
      const isPartOfGroup = await dao.checkStudenteGruppo(compitoId, studenteId);
      if (!isPartOfGroup) {
        return res
          .status(403)
          .json({ error: "Non sei autorizzato a rispondere a questo compito" });
      }

      // Inserisce o aggiorna la risposta
      const result = await dao.aggiornaRispostaCompito(compitoId, testo_risposta, studenteId);

      res.json({
        aggiornato_il: result.aggiornato_il,
        compito_id: compitoId,
        testo_risposta: testo_risposta,
      });
    } catch (error) {
      console.error("Errore PUT risposta compito:", error);
      res.status(500).json({ error: "Errore server" });
    }
  }
);

// GET: /media - Visualizza la media dello studente
router.get("/media", async (req, res) => {
  try {
    const studenteId = req.user.id;
    const risultato = await dao.ottieniMediaStudente(studenteId);

    res.json({
      studente: {
        id: req.user.id,
        nome: req.user.nome,
        cognome: req.user.cognome,
      },
      totale_compiti: risultato.totale_compiti,
      media: risultato.media,
    });
  } catch (error) {
    console.error("Errore GET media studente:", error);
    res.status(500).json({ error: "Errore server" });
  }
});

// GET: /compiti/:id - Visualizza i dettagli di un compito specifico
router.get(
  "/compiti/:id",
  [param("id").isInt({ min: 1 }).withMessage("ID compito non valido")],
  handleValidationErrors,
  async (req, res) => {
    try {
      const compitoId = parseInt(req.params.id);
      const studenteId = req.user.id;

      // Verifica che lo studente sia parte del gruppo (controllo autorizzazione)
      const isPartOfGroup = await dao.checkStudenteGruppo(compitoId, studenteId);
      if (!isPartOfGroup) {
        return res
          .status(403)
          .json({ error: "Non sei autorizzato a visualizzare questo compito" });
      }

      // Ottieni tutti i dettagli del compito con una sola chiamata
      const compito = await daoComune.ottieniCompito(compitoId);
      if (!compito) {
        return res.status(404).json({ error: "Compito non trovato" });
      }

      // Il DAO già restituisce i dati strutturati correttamente, li passiamo direttamente
      res.json({
        id: compito.id,
        traccia: compito.traccia,
        stato: compito.stato,
        creato_il: compito.creato_il,
        chiuso_il: compito.chiuso_il,
        docente: compito.docente,
        gruppo: compito.gruppo,
        numero_studenti: compito.numero_studenti,
        risposta: compito.risposta || null,
        punteggio: compito.punteggio,
      });
    } catch (error) {
      console.error("Errore GET compito dettaglio:", error);
      res.status(500).json({ error: "Errore server" });
    }
  }
);

export default router;
