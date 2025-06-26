import { useState, useEffect } from "react";
import LoadingSpinner from "./utils/LoadingSpinner";
import API from "../API";

function ValutazioneCompito({ compito, onSave, onCancel }) {
  const [punteggio, setPunteggio] = useState("");
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // carica il punteggio esistente se già valutato o ricarica il punteggio ad ogni modifica del compito
  useEffect(() => {
    if (compito?.punteggio !== null && compito?.punteggio !== undefined) {
      setPunteggio(compito.punteggio.toString());
    }
  }, [compito]);

  const validateForm = () => {
    const newErrors = {};

    // validazione punteggio - obbligatorio se c'è una risposta
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
    
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    
    try {
      // converti il punteggio in numero
      const punteggioNumero = parseInt(punteggio);
      
      const result = await API.valutaCompito(compito.id, punteggioNumero);
      
      // chiama la callback di successo passando il risultato
      onSave(result);
    } catch (error) {
      //console.error("Errore nel salvataggio:", error);
      
      //gestisci diversi tipi di errore
      let errorMessage = "Errore nel salvataggio. Riprova.";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.error) {
        errorMessage = error.error;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePunteggioChange = (e) => {
    const value = e.target.value;
    setPunteggio(value);
    
    // rimuovi l'errore se l'utente sta correggendo, riscrivendo il punteggio
    if (errors.punteggio || errors.general) {
      setErrors(prev => ({ ...prev, punteggio: null, general: null }));
    }
  };

  const getPunteggioColor = () => {
    const num = parseFloat(punteggio);
    if (isNaN(num)) return "text-muted";
    if (num >= 24) return "text-success";  // 24-30: Eccellente
    if (num >= 18) return "text-warning";  // 18-23: Sufficiente
    return "text-danger";                  // 0-17: Insufficiente
  };

  const getPunteggioLabel = () => {
    const num = parseFloat(punteggio);
    if (isNaN(num)) return "";
    if (num >= 27) return "Eccezionale";
    if (num >= 24) return "Eccellente";
    if (num >= 21) return "Buono";
    if (num >= 18) return "Sufficiente";
    return "Insufficiente";
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header py-2">
            <h5 className="modal-title mb-0">
              📊 Valutazione Compito
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onCancel}
              disabled={isSaving}
            ></button>
          </div>

          <div className="modal-body py-3">
            {/* informazioni del compito */}
            <strong style={{ fontSize: '0.9rem' }}>📋 Traccia del compito:</strong>
            <div className="bg-light rounded p-2 mb-3">
              <div className="d-flex justify-content-between align-items-start">
                <div className="flex-grow-1">
                  <p style={{ fontSize: '0.9rem' }}>{compito.traccia}</p>
                </div>
                <small className="text-muted ms-2">
                  📅 {compito.creato_il }
                </small>
              </div>
            </div>

            {/* risposta del gruppo */}
            {compito.risposta ? (
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong style={{ fontSize: '0.9rem' }}>💬 Risposta del gruppo:</strong>
                  {compito.risposta.aggiornato_il && (
                    <small className="text-muted">
                      📅 {compito.risposta.aggiornato_il}
                    </small>
                  )}
                </div>
                <div className="border rounded p-2 bg-white" style={{ fontSize: '0.95rem' }}>
                  <p className="mb-0">{compito.risposta.testo}</p>
                </div>
              </div>
            ) : (
              <div className="alert alert-warning py-2 mb-3">
                <small><strong>⚠️ Nessuna risposta consegnata</strong><br/>
                Il gruppo non ha ancora consegnato una risposta.</small>
              </div>
            )}

            {/* form di valutazione - solo se c'è una risposta */}
            {compito.risposta && (
              <form onSubmit={handleSubmit}>
                {errors.general && (
                  <div className="alert alert-danger py-2">
                    <small>{errors.general}</small>
                  </div>
                )}

                {/* campo punteggio compatto */}
                <div className="row mb-3">
                  <div className="col-md-4">
                    <label htmlFor="punteggio" className="form-label mb-1" style={{ fontSize: '0.9rem' }}>
                      📊 Punteggio (0-30) *
                    </label>
                    <input
                      type="number"
                      className={`form-control ${errors.punteggio ? 'is-invalid' : ''}`}
                      id="punteggio"
                      value={punteggio}
                      onChange={handlePunteggioChange}
                      min="0"
                      max="30"
                      step="1"
                      placeholder="0-30"
                    />
                    {errors.punteggio && (
                      <div className="invalid-feedback" style={{ fontSize: '0.8rem' }}>
                        {errors.punteggio}
                      </div>
                    )}
                  </div>
                  <div className="col-md-8">
                    {punteggio && (
                      <div className="mt-4">
                        <span className={`fw-bold ${getPunteggioColor()}`} style={{ fontSize: '0.9rem' }}>
                          {punteggio}/30 - {getPunteggioLabel()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* punteggi rapidi compatti */}
                <div className="mb-3">
                  <label className="form-label mb-2" style={{ fontSize: '0.9rem' }}>🎯 Punteggi rapidi:</label>
                  <div className="d-flex gap-1 flex-wrap">
                    {[30, 27, 24, 21, 18, 15, 12, 9, 6, 3, 0].map(voto => (
                      <button
                        key={voto}
                        type="button"
                        className={`btn btn-sm ${punteggio == voto.toString() ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setPunteggio(voto.toString())}
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                        disabled={isSaving}
                      >
                        {voto}
                      </button>
                    ))}
                  </div>
                </div>

                {/* informazioni sul punteggio */}
                <div className="bg-light rounded p-2">
                  <small className="text-muted" style={{ fontSize: '0.8rem' }}>
                    <strong>💡 Scala: </strong> 
                    27-30: Eccezionale • 24-26: Eccellente • 21-23: Buono • 18-20: Sufficiente • 0-17: Insufficiente
                  </small>
                </div>
              </form>
            )}
          </div>

          <div className="modal-footer py-2">
            <button 
              type="button" 
              className="btn btn-secondary btn-sm" 
              onClick={onCancel}
              disabled={isSaving}
            >
              ❌ Annulla
            </button>
            
            {compito.risposta && (
              <button 
                type="button"
                className="btn btn-primary btn-sm" 
                onClick={handleSubmit}
                disabled={isSaving}
              >
                {isSaving ? (
                  <LoadingSpinner variant="inline" />
                ) : (
                  <>💾 Salva Valutazione</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValutazioneCompito;