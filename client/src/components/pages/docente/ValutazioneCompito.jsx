import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router";
import LoadingSpinner from "../../utils/LoadingSpinner";
import ErrorAlert from "../../utils/ErrorAlert";
import API from "../../../API";

function ValutazioneCompito() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [compito, setCompito] = useState(null);
  const [punteggio, setPunteggio] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [staSalvando, setStaSalvando] = useState(false);

  // nuovo stato per gestire gli errori di conflitto (valutazione con risposta cambiata - valutazione quando il compito è già chiuso)
  const [alertError, setAlertError] = useState(null);

  // determina da dove arriva l'utente - se da dettaglio compito o da lista compiti
  const daDettaglio = location.state?.daDettaglio;
  const backPath = daDettaglio ? `/docente/compiti/${id}` : '/docente/compiti';
  const backText = daDettaglio ? '← Torna al dettaglio' : '← Torna alla lista';

  useEffect(() => {
    const caricaCompito = async () => {
      try {
        const response = await API.ottieniCompitoDettaglioDocente(id);
        if (response?.stato === 'chiuso') {
          navigate(`/docente/compiti/${id}`, { 
            replace: true,
            state: { warningMessage: "Il compito è già chiuso e non può essere più valutato." }
          });
          return;
        }
        setCompito(response);
        if (response?.punteggio !== null && response?.punteggio !== undefined) {
          setPunteggio(response.punteggio.toString());
        }

      } catch (error) {
        setErrors({ general: "Errore nel caricamento del compito. Riprova." });
      } finally {
        setLoading(false);
      }
    };
    if (id) caricaCompito();
  }, [id]);

  const validaForm = () => {
    const newErrors = {};
    if (!punteggio && punteggio !== "0") {
      newErrors.punteggio = "Il punteggio è obbligatorio";
    } else if (isNaN(punteggio)) {
      newErrors.punteggio = "Il punteggio deve essere un numero";
    } else if (punteggio < 0 || punteggio > 30) {
      newErrors.punteggio = "Il punteggio deve essere compreso tra 0 e 30";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validaForm()) return;
    
    setStaSalvando(true);
    try {
      const punteggioNumero = parseInt(punteggio);
      // passa il timestamp dell'ultima modifica direttamente dal compito corrente
      const timestampRisposta = compito?.risposta?.aggiornato_il.format('YYYY-MM-DD HH:mm:ss') || null;
      await API.valutaCompito(compito.id, punteggioNumero, timestampRisposta);
      
      // naviga alla pagina appropriata in base a dove arrivava l'utente
      const targetPath = daDettaglio ? `/docente/compiti/${id}` : '/docente/compiti';
      navigate(targetPath, { 
        state: { conferma: 'valutazione-completata', messaggio: `Compito valutato con successo! Punteggio: ${punteggioNumero}/30` }
      });
    } catch (error) {
      // gestione silenziosa degli errori di conflitto 
      if (error.isConflict) {
        setAlertError({
          codice: error.codice || 'GENERIC_CONFLICT',
          message: error.error,
          originalError: error
        });
      } else {
        setErrors({ general: error.error || "Errore nel salvataggio. Riprova." });
      }
    } finally {
      setStaSalvando(false);
    }
  };
  // gestione dell'alert di errore conflitto
  const handleAlertClose = () => {
    setAlertError(null);
  };

  const handleAlertAction = (action) => {
    if (action === 'back') {
      navigate(backPath);
    }
    setAlertError(null);
  };

  const handleBackClick = () => {
    navigate(backPath);
  };

  const ottieniColorePunteggio = () => {
    const num = parseFloat(punteggio);
    if (isNaN(num)) return "text-muted";
    if (num >= 24) return "text-success";
    if (num >= 18) return "text-warning";
    return "text-danger";
  };

  const ottieniPunteggioLabel = () => {
    const num = parseFloat(punteggio);
    if (isNaN(num)) return "";
    if (num >= 27) return "Eccezionale";
    if (num >= 24) return "Eccellente";
    if (num >= 21) return "Buono";
    if (num >= 18) return "Sufficiente";
    return "Insufficiente";
  };

  if (loading) return <LoadingSpinner />;
  if (!compito) {
    return (
      <div className="container my-3">
        <div className="alert alert-danger">
          <h4>Compito non trovato</h4>
          <Link to="/docente/compiti" className="btn btn-primary">← Torna ai Compiti</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container my-3">
      {/* alert modale per errori di conflitto */}
      {alertError && (
        <ErrorAlert 
          error={alertError} 
          onClose={handleAlertClose}
          onAction={handleAlertAction}
        />
      )}
      {/* breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item">
            <button 
              className="btn btn-link p-0 text-decoration-none"
              onClick={() => navigate('/docente/compiti')}
            >
              📚 Compiti
            </button>
          </li>
          <li className="breadcrumb-item">
            <button 
              className="btn btn-link p-0 text-decoration-none"
              onClick={() => navigate(`/docente/compiti/${compito.id}`)}
            >
              📋 #{compito.id}
            </button>
          </li>
          <li className="breadcrumb-item active">📊 Valutazione</li>
        </ol>
      </nav>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">📊 Valutazione Compito</h4>
        <button 
          className="btn btn-outline-secondary btn-sm"
          onClick={handleBackClick}
        >
          {backText}
        </button>
      </div>

      <div className="card">
        <div className="card-body p-3">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div className="flex-grow-1 me-3">
              <div className="d-flex align-items-center gap-2 mb-2">
                <strong className="text-muted" style={{ fontSize: '0.9rem' }}>Traccia:</strong>
                <span className="badge bg-success ms-auto">🟢 In valutazione</span>
              </div>
              <div className="bg-light border rounded p-2">
                <p className="mb-0" style={{ fontSize: '0.95rem' }}>{compito.traccia}</p>
              </div>
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <small className="text-muted">Data: </small>
              <span style={{ fontSize: '0.9rem' }}>{compito.creato_il.format('DD/MM/YYYY [alle] HH:mm')}</span>
            </div>
            <div className="col-md-6">
              <small className="text-muted">Gruppo: </small>
              <span style={{ fontSize: '0.9rem' }}>
                {compito.gruppo?.map(s => `${s.nome} ${s.cognome}`).join(', ')}
              </span>
            </div>
          </div>

          {compito.risposta ? (
            <>
              <div className="border rounded p-3 bg-light mb-3" style={{ minHeight: "120px" }}>
                <div className="mb-2">
                  <h6 className="mb-1" style={{ fontSize: '1rem' }}>👥 Risposta del gruppo</h6>
                  <small className="text-muted">
                    📅 {compito.risposta.aggiornato_il.format('DD/MM/YYYY [alle] HH:mm')}
                    {compito.risposta.inviato_da && (
                      <span className="ms-2">• Inviata da: <strong>{compito.risposta.inviato_da.nome} {compito.risposta.inviato_da.cognome}</strong></span>
                    )}
                  </small>
                </div>
                <div style={{ fontSize: '0.95rem' }}>{compito.risposta.testo}</div>
              </div>

              <form onSubmit={handleSubmit} noValidate> 
                {errors.general && (
                  <div className="alert alert-danger py-2 mb-3">
                    <strong>⚠️ {errors.general}</strong>
                  </div>
                )}
                
                <div className="row mb-3">
                  <div className="col-md-4">
                    <label htmlFor="punteggio" className="form-label">
                      📊 Punteggio (0-30) *
                    </label>
                    <input
                      type="number"
                      className={`form-control ${errors.punteggio ? 'is-invalid' : ''}`}
                      id="punteggio"
                      name="punteggio"
                      value={punteggio}
                      onChange={(e) => {
                        setPunteggio(e.target.value);
                        if (errors.punteggio || errors.general) {
                          setErrors(prev => ({ ...prev, punteggio: null, general: null }));
                        }
                      }}
                      min="0" max="30" step="1"
                      placeholder="Inserisci punteggio"
                      disabled={staSalvando}
                      required
                    />
                    {errors.punteggio && (
                      <div className="invalid-feedback">{errors.punteggio}</div>
                    )}
                    <div className="mt-2" style={{ minHeight: "2rem" }}>
                      {punteggio && (
                        <span className={`fs-5 fw-bold ${ottieniColorePunteggio()}`}>
                          {punteggio}/30 - {ottieniPunteggioLabel()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="col-md-8">
                    <fieldset>
                      <legend className="form-label small">🎯 Punteggi rapidi:</legend>
                      <div className="d-flex gap-2 flex-wrap" role="group" aria-label="Punteggi rapidi">
                        {[0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30].map(voto => (
                          <button
                            key={voto}
                            type="button"
                            className={`btn ${punteggio == voto.toString() ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setPunteggio(voto.toString())}
                            disabled={staSalvando}
                          >
                            {voto}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  </div>
                </div>

                <div className="d-flex justify-content-end align-items-center gap-2 pt-2 border-top">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleBackClick}
                    disabled={staSalvando}
                  >
                    ❌ Annulla
                  </button>
                  <button 
                    type="submit"
                    className="btn btn-primary"
                    disabled={!punteggio || staSalvando}
                  >
                    {staSalvando ? (
                      <>
                        <LoadingSpinner variant="inline" />
                        Salvataggio...
                      </>
                    ) : (
                      <>💾 Salva Valutazione</>
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="alert alert-info py-2 mb-3">
                <div className="d-flex align-items-center">
                  <span className="me-2">📝</span>
                  <div>
                    <strong style={{ fontSize: '0.95rem' }}>In attesa di risposta</strong>
                    <br />
                    <small>Il gruppo non ha ancora inviato una risposta.</small>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* legenda voti*/}
      <div className="alert alert-info mt-3">
        <div className="d-flex flex-wrap gap-3 align-items-center">
          <strong>💡 Scala di valutazione:</strong>
          <span><strong>0-17:</strong> Insufficiente</span>
          <span><strong>18-20:</strong> Sufficiente</span>
          <span><strong>21-23:</strong> Buono</span>
          <span><strong>24-26:</strong> Eccellente</span>
          <span><strong>27-30:</strong> Eccezionale</span>
        </div>
      </div>
    </div>
  );
}

export default ValutazioneCompito;