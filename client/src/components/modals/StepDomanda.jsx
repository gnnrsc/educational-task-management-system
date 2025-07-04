import { Form, Alert } from "react-bootstrap";

function StepDomanda({ 
  visibile, 
  direzioneSlide, 
  domanda, 
  onCambioDomanda, 
  invioInCorso, 
  errore 
}) {
  if (!visibile) return null;

  return (
    <div className={`modal-step ${direzioneSlide} ${!visibile ? 'step-hidden' : ''}`}>
      <Form>
        <Form.Group className="mb-4" controlId="taskQuestion">
          <Form.Label className="fw-bold mb-3">✍️ Inserisci la traccia del compito</Form.Label>
          <Form.Control
            as="textarea"
            rows={5}
            placeholder="Scrivi qui il testo del compito che vuoi assegnare agli studenti..."
            value={domanda}
            onChange={(e) => onCambioDomanda(e.target.value)}
            disabled={invioInCorso}
            style={{ 
              fontSize: '0.95rem',
              lineHeight: '1.5'
            }}
          />
        </Form.Group>
        
        <ContatoreCaratteri domanda={domanda} />
        <BoxInformativo />
        
        {errore && (
          <Alert variant="danger" className="py-2 mb-3">
            <small>{errore}</small>
          </Alert>
        )}
      </Form>
    </div>
  );
}

function BoxInformativo() {
  return (
    <>
      <div className="bg-light rounded p-3 mb-4">
        <small className="text-muted">
          <strong>💡 Suggerimento:</strong> Scrivi una domanda chiara e
          specifica. Gli studenti lavoreranno insieme per rispondere, quindi
          assicurati che il compito sia adatto al lavoro di gruppo.
        </small>
      </div>
      <div className="bg-light rounded p-3 mb-4">
        <small className="text-muted">
        ✨ <strong>Lo sapevi?</strong> Un compito ben strutturato stimola il
        pensiero critico e la collaborazione tra pari.
        </small>
      </div>
    </>
  );
}

function ContatoreCaratteri({ domanda }) {
  return (
    <div className="d-flex justify-content-between align-items-center mb-3">
      <small className="text-muted">
        Caratteri: {domanda.length}
      </small>
      {domanda.length > 500 && (
        <small className="text-warning">
          ⚠️ Testo molto lungo
        </small>
      )}
    </div>
  );
}

export default StepDomanda;