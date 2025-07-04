import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { useAuth } from "../../../AuthContext";
import LoadingSpinner from "../../utils/LoadingSpinner";
import ErrorAlert from "../../utils/ErrorAlert";
import RisoluzioneConflitti from "../../utils/RisoluzioneConflitti";
import API from "../../../API";

function RispostaCompito() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { user } = useAuth();
  
  const [compito, setCompito] = useState(null);
  const [testoRisposta, setTestoRisposta] = useState("");
  const [errors, setErrors] = useState({});
  const [staSalvando, setStaSalvando] = useState(false);
  const [caratteri, setCaratteri] = useState(0);
  const [loading, setLoading] = useState(true);

  // nuovo stato per gestire gli errori di conflitto (risposta quando il compito è già chiuso - risposta modificata da un altro membro del gruppo)
  const [alertErrore, setAlertErrore] = useState(null);
  const [erroreConflitto, setErroreConflitto] = useState(null);

  const MAX_CARATTERI = 2000;

  // determina da dove arriva l'utente - se da dettaglio compito o da lista compiti
  const daDettaglio = location.state?.daDettaglio;
  const backPath = daDettaglio ? `/studente/compiti/${id}` : '/studente/compiti';
  const backText = daDettaglio ? '← Torna al dettaglio' : '← Torna ai miei compiti';

  // carica il compito
  useEffect(() => {
    const caricaCompito = async () => {
      setLoading(true);
      try {
        const response = await API.ottieniCompitoDettaglioStudente(id);
        
        // Controlla se il compito è chiuso e reindirizza
        if (response?.stato === 'chiuso') {
          navigate(`/studente/compiti/${id}`, { 
            replace: true,
            state: { warningMessage: "Il compito è chiuso e non può essere più modificato." }
          });
          return; // il componente verrà smontato
        }
        
        setCompito(response);
        
        // carica la risposta esistente se già presente
        if (response.risposta?.testo) {
          setTestoRisposta(response.risposta.testo);
          setCaratteri(response.risposta.testo.length);
        }
      } catch (error) {
        //console.error("Errore nel caricamento compito:", error);
        setErrors({ general: "Errore nel caricamento del compito" });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      caricaCompito();
    }
  }, [id]);

  const validaForm = () => {
    const newErrors = {};

    if (!testoRisposta.trim()) {
      newErrors.testoRisposta = "La risposta non può essere vuota";
    } else if (testoRisposta.length > MAX_CARATTERI) {
      newErrors.testoRisposta = `La risposta non può superare i ${MAX_CARATTERI} caratteri`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validaForm()) {
      return;
    }

    setStaSalvando(true);

    try {
      const timestampRisposta =
        compito?.risposta?.aggiornato_il?.format("YYYY-MM-DD HH:mm:ss") || null;
      const result = await API.aggiornaRispostaCompito(
        compito.id,
        testoRisposta.trim(),
        timestampRisposta
      );

      // naviga alla pagina appropriata in base a dove arrivava l'utente
      const targetPath = daDettaglio ? `/studente/compiti/${id}` : '/studente/compiti';

      navigate(targetPath, {
        state: {
          conferma: result.modificato ? 'risposta-modificata' : 'risposta-inviata',
          messaggio: result.modificato ? 'Risposta modificata con successo!' : 'Risposta inviata con successo!'
        }
      });
    } catch (error) {
      if (error.isConflict && error.codice === "RISPOSTA_MODIFICATA_STUDENTE") {
        setErroreConflitto(error);
      } else if (error.isConflict) {
        setAlertErrore({
          codice: error.codice || "GENERIC_CONFLICT",
          message: error.error,
          originalError: error,
        });
      } else {
        setErrors({
          general: error.error || "Errore nel salvataggio. Riprova.",
        });
      }
    } finally {
      setStaSalvando(false);
    }
  };

  const handleRisolviConflitto = async (risoluzione) => {
    setStaSalvando(true);
    try {
      const targetPath = daDettaglio ? `/studente/compiti/${id}` : '/studente/compiti';
      if (risoluzione.useCurrentResponse) {
        // usa la risposta corrente dal database
        //setTestoRisposta(risoluzione.response);
        //setCaratteri(risoluzione.response.length);
        navigate(targetPath);
      } else {
        // forza l'aggiornamento con la tua risposta, passo il timestamp della versione che sto sovrascrivendo per procedere con l'aggiornamento 
        const result = await API.aggiornaRispostaCompito(compito.id, risoluzione.response, erroreConflitto.dettagli.ultimaModifica );
        
        navigate(targetPath, { 
          state: { 
            conferma: 'risposta-modificata',
            messaggio: 'Risposta aggiornata con successo!'
          }
        });
      }
    } catch (error) {
      setErrors({ general: "Errore nella risoluzione del conflitto. Riprova." });
    } finally {
      setStaSalvando(false);
      setErroreConflitto(null);
    }
  };

  const handleChiudiConflitto = () => {
    setErroreConflitto(null);
  };

  // gestione dell'alert di errore conflitto
  const handleChiudiAlert = () => {
    setAlertErrore(null);
  };

  const handleAzioneAlert = (action) => {
    if (action === 'back') {
      navigate(backPath);
    }
    setAlertErrore(null);
  };

  const handleTestoCambia = (e) => {
    const value = e.target.value;
    setTestoRisposta(value);
    setCaratteri(value.length);
    
    if (errors.testoRisposta || errors.general) {
      setErrors(prev => ({ ...prev, testoRisposta: null, general: null }));
    }
  };

  const ottieniColoreCaratteri = () => {
    const percentuale = (caratteri / MAX_CARATTERI) * 100;
    if (percentuale >= 90) return "text-danger";
    if (percentuale >= 75) return "text-warning";
    return "text-muted";
  };

  const handleTornaIndietro = () => {
    navigate(backPath);
  };

  

  if (loading) return <LoadingSpinner />;

  // Se il compito è chiuso, non renderizzare nulla (il redirect è già in corso)
  if (compito?.stato === 'chiuso') {
    return <LoadingSpinner />;
  }

  if (!compito) {
    return (
      <div className="container my-3">
        <div className="alert alert-danger">
          Compito non trovato
        </div>
      </div>
    );
  }

  const haInviatoRisposta = compito?.risposta?.inviato_da?.id === user.id;
  const isModifica = compito?.risposta?.testo;

  return (
    <div className="container my-3">
      {/* alert per conflitti di modifica */}
      {erroreConflitto && (
        <RisoluzioneConflitti 
          error={erroreConflitto}
          onClose={handleChiudiConflitto}
          onResolve={handleRisolviConflitto}
        />
      )}
      {/* alert modale per errori di conflitto */}
      {alertErrore && (
        <ErrorAlert 
          error={alertErrore} 
          onClose={handleChiudiAlert}
          onAction={handleAzioneAlert}
        />
      )}
      {/* breadcrumb compatto */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item">
            <button
              type="button"
              className="btn btn-link p-0 text-decoration-none"
              onClick={handleTornaIndietro}
            >
              📚 I miei Compiti
            </button>
          </li>
          <li className="breadcrumb-item">
            <button
              className="btn btn-link p-0 text-decoration-none"
              onClick={() => navigate(`/studente/compiti/${compito.id}`)}
            >
              📋 #{compito.id}
            </button>
          </li>
          <li className="breadcrumb-item active">
            {isModifica ? "✏️ Modifica Risposta" : "📝 Inserisci Risposta"}
          </li>
        </ol>
      </nav>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">
          {isModifica ? "✏️ Modifica Risposta" : "📝 Inserisci Risposta"}
        </h4>
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={handleTornaIndietro}
        >
          {backText}
        </button>
      </div>

      <div className="card">
        <div className="card-body p-3">
          {/* Informazioni del compito */}
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div className="flex-grow-1 me-3">
              <div className="d-flex align-items-center gap-2 mb-2">
                <strong className="text-muted" style={{ fontSize: "0.9rem" }}>
                  Traccia:
                </strong>
                <span
                  className={`badge bg-${
                    compito.stato === "aperto" ? "success" : "secondary"
                  } ms-auto`}
                >
                  {compito.stato === "aperto" ? "🟢 Aperto" : "🔴 Chiuso"}
                </span>
              </div>
              <div className="bg-light border rounded p-3">
                <p className="mb-0" style={{ fontSize: "0.95rem" }}>
                  {compito.traccia}
                </p>
              </div>
            </div>
          </div>

          {/* informazioni del compito */}
          <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
            <div className="d-flex align-items-center gap-1">
              <small className="text-muted">Data assegnazione:</small>
              <span style={{ fontSize: "0.9rem" }}>
                {compito.creato_il.format("DD/MM/YYYY [alle] HH:mm")}
              </span>
            </div>

            <div className="d-flex align-items-center gap-1">
              <small className="text-muted">Docente:</small>
              <span style={{ fontSize: "0.9rem" }}>
                {compito.docente
                  ? `${compito.docente.nome} ${compito.docente.cognome}`
                  : "N/A"}
              </span>
            </div>

            <div className="d-flex align-items-center gap-1">
              <small className="text-muted">
                Gruppo ({compito.gruppo?.length || 0} studenti):
              </small>
              <div className="d-flex flex-wrap gap-1">
                {compito.gruppo?.map((membro) => (
                  <span
                    key={membro.id}
                    className={`badge ${
                      membro.id === user.id
                        ? "bg-primary"
                        : "bg-light text-dark border"
                    }`}
                    style={{ fontSize: "0.75rem" }}
                  >
                    {membro.id === user.id ? "👤 " : ""}
                    {membro.nome} {membro.cognome}
                    {membro.id === user.id ? " (Tu)" : ""}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Info sulla modifica se presente */}
          {isModifica && compito.risposta.aggiornato_il && (
            <div className="d-flex flex-wrap align-items-center gap-3 mb-3 p-2 bg-light rounded">
              <div className="d-flex align-items-center gap-1">
                <small className="text-muted">📅 Ultima modifica:</small>
                <span style={{ fontSize: "0.9rem" }}>
                  {compito.risposta.aggiornato_il.format(
                    "DD/MM/YYYY [alle] HH:mm"
                  )}
                </span>
              </div>
              <div className="d-flex align-items-center gap-1">
                <small className="text-muted">Inviata da:</small>
                <strong>
                  {compito.risposta.inviato_da.id === user.id
                    ? "Te"
                    : `${compito.risposta.inviato_da.nome} ${compito.risposta.inviato_da.cognome}`}
                </strong>
              </div>
            </div>
          )}

          {/* Form di risposta */}
          <form onSubmit={handleSubmit}>
            {errors.general && (
              <div className="alert alert-danger py-2 mb-3">
                <small>{errors.general}</small>
              </div>
            )}

            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label htmlFor="testoRisposta" className="form-label mb-0">
                  <strong style={{ fontSize: "0.9rem" }}>
                    💬 Risposta del gruppo *
                  </strong>
                  {haInviatoRisposta && (
                    <span className="badge bg-success ms-2">
                      ✓ Inviata da te
                    </span>
                  )}
                </label>
                <small className={`${ottieniColoreCaratteri()}`}>
                  {caratteri}/{MAX_CARATTERI} caratteri
                </small>
              </div>
              <textarea
                className={`form-control ${
                  errors.testoRisposta ? "is-invalid" : ""
                }`}
                id="testoRisposta"
                value={testoRisposta}
                onChange={handleTestoCambia}
                rows="8"
                placeholder="Inserisci qui la risposta del gruppo al compito..."
                maxLength={MAX_CARATTERI}
                disabled={staSalvando}
                style={{ fontSize: "0.95rem" }}
              />
              {errors.testoRisposta && (
                <div className="invalid-feedback">{errors.testoRisposta}</div>
              )}
            </div>

            {/* Bottoni */}
            <div className="d-flex justify-content-end align-items-center gap-2 mb-3">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleTornaIndietro}
                disabled={staSalvando}
              >
                ❌ Annulla
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={staSalvando || !testoRisposta.trim()}
              >
                {staSalvando ? (
                  <LoadingSpinner variant="inline" />
                ) : (
                  <>
                    {isModifica ? "💾 Aggiorna Risposta" : "📤 Invia Risposta"}
                  </>
                )}
              </button>
            </div>

            {/* Suggerimenti */}
            <div className="alert alert-info py-2 mb-0">
              <small>
                <strong>💡 Suggerimenti:</strong>
                <br />
                • Puoi sempre modificare la risposta finché il docente non la
                valuta
                <br />• Tutti i membri del gruppo possono vedere e modificare
                questa risposta
              </small>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RispostaCompito;