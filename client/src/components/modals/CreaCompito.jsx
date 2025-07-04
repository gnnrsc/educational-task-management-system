import { useState, useEffect } from "react";
import API from "../../API";
import { Utente } from "../../models/Utente.mjs";
import { Compito } from "../../models/Compito.mjs";
import StepDomanda from "./StepDomanda";
import StepSelezioneStudenti from "./StepSelezioneStudenti";
import FooterNavigazione from "./FooterNavigazione";
import ErrorAlert from "../utils/ErrorAlert";
import ConfermaAzione from "../utils/ConfermaAzione";

function CreaCompito({ onCompitoCreato, onCancella, stepIniziale = 1, domandaIniziale = "", onSalvaStato = null }) {

  const SELEZIONE_MINIMA = 2;
  const SELEZIONE_MASSIMA = 6;
 
  const [stepCorrente, setStepCorrente] = useState(stepIniziale);
  const [domanda, setDomanda] = useState(domandaIniziale);
  const [studentiSelezionati, setStudentiSelezionati] = useState([]);
  const [studenti, setStudenti] = useState([]);
  const [collaborazioni, setCollaborazioni] = useState([]);
  const [errore, setErrore] = useState("");
  
  // stati per gestione delle varie visualizzazioni e caricamenti
  const [caricamentoStudenti, setCaricamentoStudenti] = useState(true);
  const [invioInCorso, setInvioInCorso] = useState(false);
  const [direzioneSlide, setDirezioneSlide] = useState("");

  // stato per gestire gli errori di conflitto (numero di collaborazioni superate - stesso docente con 2 sessioni)
  const [alertErrore, setAlertErrore] = useState(null);
  // stato per mostrare la conferma di invio
  const [mostraConferma, setMostraConferma] = useState(false);

  // sincronizza con props quando cambiano
  useEffect(() => {
      setStepCorrente(stepIniziale);
      setDomanda(domandaIniziale);
  }, [stepIniziale, domandaIniziale]);

  // carica i dati degli studenti e collaborazioni
  useEffect(() => {
    const caricaDati = async () => {
      try {
        const [rispostaStudenti, rispostaCollaborazioni] = await Promise.all([
          API.ottieniStudenti(),
          API.ottieniCollaborazioniClasse()
        ]);

        const studentiMappati = rispostaStudenti.map((utente) => new Utente(utente));
        setStudenti(studentiMappati);
        setCollaborazioni(rispostaCollaborazioni.collaborazioni);
      } catch (err) {
        setErrore("Errore nel caricamento dei dati");
      } finally {
        setCaricamentoStudenti(false);
      }
    };

    caricaDati();
  }, []);

  // GESTORI EVENTI

  const handleCambioDomanda = (nuovaDomanda) => {
    setDomanda(nuovaDomanda);
    // salva lo stato attuale
    if (onSalvaStato) {
      onSalvaStato(stepCorrente, nuovaDomanda, true);
    }
  };

  const gestisciAvanti = () => {
    setErrore("");
    if (!domanda.trim()) {
      setErrore("La domanda non può essere vuota.");
      return;
    }
    //classe css per la transizione a sinistra
    setDirezioneSlide("slide-left");
    setTimeout(() => {
      setStepCorrente(2);
      if (onSalvaStato) {
        onSalvaStato(2, domanda, true);
      }
      setDirezioneSlide("");
    }, 300);
  };

  const gestisciIndietro = () => {
    setErrore("");
    //classe css per la transizione a destra
    setDirezioneSlide("slide-right");
    setTimeout(() => {
      setStepCorrente(1);
      if (onSalvaStato) {
        onSalvaStato(1, domanda, true);
      }
      setDirezioneSlide("");
    }, 300);
  };

  const gestisciToggleStudente = (studenteId) => {
    setErrore("");
    setStudentiSelezionati((precedenti) => {
      const giaSelezionato = precedenti.find(s => s.id === studenteId);
      
      if (giaSelezionato) {
        return precedenti.filter((studente) => studente.id !== studenteId);
      } else {
        if (precedenti.length >= SELEZIONE_MASSIMA) {
          setErrore(`Hai raggiunto il limite massimo di ${SELEZIONE_MASSIMA} studenti.`);
          return precedenti;
        }
        
        const studenteDaAggiungere = studenti.find(s => s.id === studenteId);
        if (studenteDaAggiungere) {
          return [...precedenti, studenteDaAggiungere];
        }
        return precedenti;
      }
    });
  };

  const gestisciResetSelezione = () => {
    setStudentiSelezionati([]);
    setErrore("");
  };

  const gestisciInvio = async () => {
    setErrore("");

    const gruppoValido = studentiSelezionati.length >= SELEZIONE_MINIMA && 
      studentiSelezionati.length <= SELEZIONE_MASSIMA;

    if (!gruppoValido) {
      setErrore(`Il gruppo deve avere almeno ${SELEZIONE_MINIMA} studenti e al massimo ${SELEZIONE_MASSIMA}.`);
      return;
    }

    // mostra la conferma azione, invece di procedere direttamente all'invio
    setMostraConferma(true);
  };


  const gestisciConfermaCreazione = async () => {
    setInvioInCorso(true);

    try {
      const studentiIds = studentiSelezionati.map((studente) => studente.id);
      const risultato = await API.creaCompito(domanda.trim(), studentiIds);

      if (risultato && risultato.id) {
        const compitoCreato = new Compito({
          id: risultato.id,
          traccia: domanda.trim(),
          stato: "aperto",
          creato_il: risultato.creato_il,
          numero_studenti: studentiIds.length,
          gruppo: studentiSelezionati,
        });

        // reset del form all'invio
        setDomanda("");
        setStudentiSelezionati([]);
        setStepCorrente(1);
        setMostraConferma(false);

        onCompitoCreato(compitoCreato);
      } else {
        setErrore("Compito non creato correttamente. Riprova.");
        setMostraConferma(false);
      }
    } catch (error) {
      // gestione silenziosa degli errori di conflitto
      if (error.isConflict) {
        setAlertErrore({
          codice: error.codice || "GENERIC_CONFLICT",
          message: error.error,
          dettagli: error.dettagli,
          originalError: error,
        });
      } else {
        setErrore("Errore nella creazione del compito. Riprova.");
      }
      setMostraConferma(false);
    } finally {
      setInvioInCorso(false);
    }
  };

  // handle per annullare la creazione dalla conferma
  const gestisciAnnullaConferma = () => {
    setMostraConferma(false);
  };

  // gestione dell'alert di errore conflitto
  const handleChiudiAlert = () => {
    setAlertErrore(null);
  };

  const handleAzioneAlert = (action) => {
    if (action === 'cancel') {
      // reset completo del form
      setDomanda("");
      setStudentiSelezionati([]);
      setStepCorrente(1);
      if (onCancella) onCancella();
    } else if (action === 'close') {
      // torna al step di selezione studenti per modificare il gruppo
      setStepCorrente(2);
    }
    setAlertErrore(null);
  };

  // funzioni utility

  const gruppoValido = studentiSelezionati.length >= SELEZIONE_MINIMA && 
                      studentiSelezionati.length <= SELEZIONE_MASSIMA;

  const ottieniTitoloStep = () => {
    return stepCorrente === 1 ? "📝 Domanda del Compito" : "👥 Seleziona Studenti";
  };

  const ottieniProgresso = () => {
    return `${stepCorrente}/2`;
  };

  return (
    <div className="p-4">
      {/* componente di conferma creazione */}
      <ConfermaAzione
        tipo="compito"
        mostra={mostraConferma}
        onConferma={gestisciConfermaCreazione}
        onAnnulla={gestisciAnnullaConferma}
        caricamentoInCorso={invioInCorso}
      />
      {/* alert modale per errori di conflitto */}
      {alertErrore && (
        <ErrorAlert
          error={alertErrore}
          onClose={handleChiudiAlert}
          onAction={handleAzioneAlert}
        />
      )}
      {/* Intestazione step */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0 fw-bold">{ottieniTitoloStep()}</h6>
        <small className="text-muted">Step {ottieniProgresso()}</small>
      </div>

      {/* Indicatore di progresso */}
      <div className="progress-indicator">
        <div className={`progress-dot ${stepCorrente >= 1 ? 'active' : ''}`}></div>
        <div className={`progress-line ${stepCorrente >= 2 ? 'active' : ''}`}></div>
        <div className={`progress-dot ${stepCorrente >= 2 ? 'active' : ''}`}></div>
      </div>

      <div className="modal-slide-container">
        {/* Componente per la gestione del primo step: scelta della domanda*/}
        <StepDomanda
          visibile={stepCorrente === 1}
          direzioneSlide={direzioneSlide}
          domanda={domanda}
          onCambioDomanda={handleCambioDomanda}
          invioInCorso={invioInCorso}
          errore={errore}
        />

        {/* Componente per la gestione del secondo step: selezione degli studenti*/}
        <StepSelezioneStudenti
          visibile={stepCorrente === 2}
          direzioneSlide={direzioneSlide}
          domanda={domanda}
          studenti={studenti}
          studentiSelezionati={studentiSelezionati}
          collaborazioni={collaborazioni}
          caricamentoStudenti={caricamentoStudenti}
          invioInCorso={invioInCorso}
          errore={errore}
          selezioneMinima={SELEZIONE_MINIMA}
          selezioneMassima={SELEZIONE_MASSIMA}
          gruppoValido={gruppoValido}
          onToggleStudente={gestisciToggleStudente}
          onResetSelezione={gestisciResetSelezione}
        />
      </div>

      <FooterNavigazione
        stepCorrente={stepCorrente}
        domanda={domanda}
        invioInCorso={invioInCorso}
        gruppoValido={gruppoValido}
        onIndietro={gestisciIndietro}
        onAvanti={gestisciAvanti}
        onInvio={gestisciInvio}
        onAnnulla={onCancella}
      />
    </div>
  );
}

export default CreaCompito;