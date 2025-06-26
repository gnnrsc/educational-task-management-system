import { useState, useEffect } from "react";
import API from "../API";
import { Utente } from "../models/Utente.mjs";
import { Compito } from "../models/Compito.mjs";
import StepDomanda from "./CreaCompitoComponents/StepDomanda";
import StepSelezioneStudenti from "./CreaCompitoComponents/StepSelezioneStudenti";
import FooterNavigazione from "./CreaCompitoComponents/FooterNavigazione";

function CreaCompito({ onCompitoCreato, onCancel, initialData = null }) {
  const [stepCorrente, setStepCorrente] = useState(initialData ? 2 : 1);
  const [domanda, setDomanda] = useState(initialData ? initialData.traccia : "");
  const [studentiSelezionati, setStudentiSelezionati] = useState([]);
  const [studenti, setStudenti] = useState([]);
  const [collaborazioni, setCollaborazioni] = useState([]);
  const [errore, setErrore] = useState("");
  const [caricamentoStudenti, setCaricamentoStudenti] = useState(true);
  const [invioInCorso, setInvioInCorso] = useState(false);
  const [direzioneSlide, setDirezioneSlide] = useState("");

  const SELEZIONE_MINIMA = 2;
  const SELEZIONE_MASSIMA = 6;

  useEffect(() => {
    const caricaDati = async () => {
      try {
        const [rispostaStudenti, rispostaCollaborazioni] = await Promise.all([
          API.getStudenti(),
          API.getCollaborazioniClasse()
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
      setDirezioneSlide("");
    }, 300);
  };

  const gestisciIndietro = () => {
    setErrore("");
    //classe css per la transizione a destra
    setDirezioneSlide("slide-right");
    setTimeout(() => {
      setStepCorrente(1);
      setDirezioneSlide("");
    }, 300);
  };

  const gruppoValido = studentiSelezionati.length >= SELEZIONE_MINIMA && 
                      studentiSelezionati.length <= SELEZIONE_MASSIMA;

  const gestisciInvio = async () => {
    setErrore("");

    if (!gruppoValido) {
      setErrore(
        `Il gruppo deve avere almeno ${SELEZIONE_MINIMA} studenti e al massimo ${SELEZIONE_MASSIMA}.`
      );
      return;
    }

    setInvioInCorso(true);
    
    try {
      const studentIds = studentiSelezionati.map(studente => studente.id);
      const risultato = await API.createCompito(domanda.trim(), studentIds);

      if (risultato && risultato.id) {
        const compitoCreato = new Compito({
          id: risultato.id,
          traccia: domanda.trim(),
          stato: "aperto",
          creato_il: risultato.creato_il,
          numero_studenti: studentIds.length,
          gruppo: studentiSelezionati,
        });
                                  
        onCompitoCreato(compitoCreato);
        setDomanda("");
        setStudentiSelezionati([]);
        setStepCorrente(1);
      } else {
        setErrore("Compito non creato correttamente. Riprova.");
      }
      
    } catch (error) {
      //console.error("Errore nella creazione del compito:", error);
      setErrore("Errore nella creazione del compito. Riprova.");
    } finally {
      setInvioInCorso(false);
    }
  };

  const gestisciToggleStudente = (studenteId) => {
    setErrore("");
    //gestione della selezione degli studenti con lo stato
    setStudentiSelezionati((precedenti) => {
      const giaSelezionato = precedenti.find(s => s.id === studenteId);
      
      if (giaSelezionato) {
        //se lo studente è già selezionato, lo rimuoviamo da quelli selezionati
        return precedenti.filter((studente) => studente.id !== studenteId);
      } else {
        if (precedenti.length >= SELEZIONE_MASSIMA) {
          setErrore(
            `Hai raggiunto il limite massimo di ${SELEZIONE_MASSIMA} studenti.`
          );
          return precedenti;
        }
        
        //trovo lo l'oggetto Utente e lo aggiungo all'elenco dei selezionati
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

  const getTitoloStep = () => {
    if (stepCorrente === 1) return "📝 Domanda del Compito";
    return "👥 Seleziona Studenti";
  };

  const getProgresso = () => {
    return `${stepCorrente}/2`;
  };

  return (
    <div className="p-4">
      { /* Intestazione step */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0 fw-bold">{getTitoloStep()}</h6>
        <small className="text-muted">Step {getProgresso()}</small>
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
          onCambioDomanda={setDomanda}
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
        onAnnulla={onCancel}
      />
    </div>
  );
}

export default CreaCompito;