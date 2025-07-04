import { useState } from 'react';

const RisoluzioneConflitti = ({ error, onClose, onResolve }) => {
  const [selectedOption, setSelectedOption] = useState('current');

  if (!error || error.codice !== 'RISPOSTA_MODIFICATA_STUDENTE') return null;

  const { dettagli } = error;

  const handleResolve = () => {
    const resolution = selectedOption === 'current' 
      ? { useCurrentResponse: true, response: dettagli.rispostaCorrente }
      : { useCurrentResponse: false, response: dettagli.tuaRisposta };
    
    onResolve(resolution);
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-warning">
          <div className="modal-header bg-warning text-dark">
            <h5 className="modal-title">⚠️ Conflitto di Modifica Rilevato</h5>
          </div>
          <div className="modal-body">
            <p className="mb-3">
              <strong>{dettagli.modificataDa.nome} {dettagli.modificataDa.cognome}</strong> ha modificato 
              la risposta mentre stavi scrivendo. Scegli quale versione mantenere:
            </p>

            <div className="row">
              <div className="col-md-6">
                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="RisoluzioneConflitti"
                    id="keepCurrent"
                    value="current"
                    checked={selectedOption === 'current'}
                    onChange={(e) => setSelectedOption(e.target.value)}
                  />
                  <label className="form-check-label fw-bold" htmlFor="keepCurrent">
                    📄 Mantieni la versione attuale
                  </label>
                </div>
                <div className="border rounded p-3 bg-light" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  <small className="text-muted d-block mb-2">
                    Modificata da <strong>{dettagli.modificataDa.nome} {dettagli.modificataDa.cognome}</strong>
                  </small>
                  <div style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                    {dettagli.rispostaCorrente}
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="RisoluzioneConflitti"
                    id="keepYours"
                    value="yours"
                    checked={selectedOption === 'yours'}
                    onChange={(e) => setSelectedOption(e.target.value)}
                  />
                  <label className="form-check-label fw-bold" htmlFor="keepYours">
                    ✏️ Usa la tua versione
                  </label>
                </div>
                <div className="border rounded p-3 bg-primary bg-opacity-10" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  <small className="text-muted d-block mb-2">
                    La tua versione
                  </small>
                  <div style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                    {dettagli.tuaRisposta}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              ❌ Annulla
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleResolve}
            >
              ✅ Conferma Scelta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RisoluzioneConflitti;
