import { useState, useEffect } from "react";
import LoadingSpinner from "./utils/LoadingSpinner";

function RispostaCompito({ compito, onSalva, onCancella }) {
  const [testoRisposta, setTestoRisposta] = useState("");
  const [errors, setErrors] = useState({});
  const [staSalvando, setStaSalvando] = useState(false);
  const [caratteri, setCaratteri] = useState(0);

  const MAX_CARATTERI = 2000;

  // carica la risposta esistente se già presente
  useEffect(() => {
    if (compito?.risposta?.testo) {
      setTestoRisposta(compito.risposta.testo);
      setCaratteri(compito.risposta.testo.length);
    }
  }, [compito]);

  const validaForm = () => {
    const newErrors = {};

    // validazione testo risposta
    if (!testoRisposta.trim()) {
      newErrors.testoRisposta = "La risposta non può essere vuota";
    } else if (testoRisposta.length > MAX_CARATTERI) {
      newErrors.testoRisposta = `La risposta non può superare i ${MAX_CARATTERI} caratteri`;
    } else if (testoRisposta.length < 10) {
      newErrors.testoRisposta = "La risposta deve contenere almeno 10 caratteri";
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
      await onSalva(testoRisposta.trim());
      // il modale viene chiuso dalla funzione parent onSalva
    } catch (error) {
      console.error("Errore nel salvataggio:", error);
      
      // gestisci diversi tipi di errore
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
      setStaSalvando(false);
    }
  };

  const handleTestoCambia = (e) => {
    const value = e.target.value;
    setTestoRisposta(value);
    setCaratteri(value.length);
    
    // rimuovi l'errore se l'utente sta correggendo
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

  const isModifica = compito?.risposta?.testo;

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header py-2">
            <h5 className="modal-title mb-0">
              {isModifica ? "✏️ Modifica Risposta" : "📝 Inserisci Risposta"}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onCancella}
              disabled={staSalvando}
            ></button>
          </div>

          <div className="modal-body py-3">
            {/* informazioni del compito */}
            <div className="mb-3">
              <strong style={{ fontSize: "0.9rem" }}>
                📋 Traccia del compito:
              </strong>
              <div className="bg-light rounded p-2 mt-1">
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <p className="mb-0" style={{ fontSize: "0.9rem" }}>
                      {compito.traccia}
                    </p>
                  </div>
                  <small className="text-muted ms-2">
                    📅 {compito.creato_il}
                  </small>
                </div>
              </div>
            </div>

            {/* informazioni gruppo */}
            <div className="mb-3">
              <strong style={{ fontSize: "0.9rem" }}>
                👥 Compagni di gruppo:
              </strong>
              <div className="d-flex flex-wrap gap-1 mt-1">
                {compito.gruppo.map((utente, j) => (
                  <span
                    key={`${compito.id}-${utente.id || j}`}
                    className="badge bg-primary text-white"
                  >
                    {utente.cognome} {utente.nome}
                  </span>
                ))}
              </div>
              <small className="text-muted">
                💡 Qualsiasi membro del gruppo può inserire o modificare la
                risposta
              </small>
            </div>

            {/* risposta precedente se in modifica */}
            {isModifica && compito.risposta.aggiornato_il && (
              <div className="alert alert-info py-2 mb-3">
                <small>
                  <strong>📅 Ultima modifica:</strong>{" "}
                  {compito.risposta.aggiornato_il}
                </small>
                <span className="ms-2">
                  • Inviata da:{" "}
                  <strong>
                    {compito.risposta.inviato_da.nome}{" "}
                    {compito.risposta.inviato_da.cognome}
                  </strong>
                </span>
              </div>
            )}

            {/* form di risposta */}
            <form onSubmit={handleSubmit}>
              {errors.general && (
                <div className="alert alert-danger py-2">
                  <small>{errors.general}</small>
                </div>
              )}

              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label
                    htmlFor="testoRisposta"
                    className="form-label mb-0"
                    style={{ fontSize: "0.9rem" }}
                  >
                    💬 Risposta del gruppo *
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
                  rows="6"
                  placeholder="Inserisci qui la risposta del gruppo al compito..."
                  maxLength={MAX_CARATTERI}
                  disabled={staSalvando}
                />
                {errors.testoRisposta && (
                  <div
                    className="invalid-feedback"
                    style={{ fontSize: "0.8rem" }}
                  >
                    {errors.testoRisposta}
                  </div>
                )}
              </div>

              {/* suggerimenti */}
              <div className="bg-light rounded p-2">
                <small className="text-muted" style={{ fontSize: "0.8rem" }}>
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

          <div className="modal-footer py-2">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onCancella}
              disabled={staSalvando}
            >
              ❌ Annulla
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSubmit}
              disabled={staSalvando || !testoRisposta.trim()}
            >
              {staSalvando ? (
                <LoadingSpinner variant="inline" />
              ) : (
                <>{isModifica ? "💾 Aggiorna Risposta" : "📤 Invia Risposta"}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RispostaCompito;