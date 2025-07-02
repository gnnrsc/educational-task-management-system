import { Modal, Button } from "react-bootstrap";

function ConfermaAzione({ 
  mostra, 
  tipo = 'compito', // 'compito' | 'valutazione'
  onConferma, 
  onAnnulla,
  caricamentoInCorso = false 
}) {
  if (!mostra) return null;

  // Configurazione basata sul tipo
  const config = {
    compito: {
      titolo: "Conferma Creazione",
      icona: "⚠️",
      messaggio: "Sei sicuro di voler creare questo compito?",
      avviso: "L'azione non potrà essere annullata.",
      pulsanteConferma: "✅ Crea Compito",
      pulsanteCaricamento: "Creazione..."
    },
    valutazione: {
      titolo: "Conferma Valutazione",
      icona: "📊",
      messaggio: "Sei sicuro di voler inviare questa valutazione?",
      avviso: "Il compito verrà chiuso e non potrai più modificare la valutazione.",
      pulsanteConferma: "✅ Invia Valutazione",
      pulsanteCaricamento: "Invio..."
    }
  };

  const currentConfig = config[tipo];

  return (
    <Modal 
      show={mostra} 
      onHide={onAnnulla}
      backdrop="static"
      keyboard={false}
      centered
      animation={false}
      style={{ zIndex: 1060 }}
    >
      <div 
        className="modal-backdrop" 
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: -1
        }}
      />
      
      <Modal.Header closeButton={!caricamentoInCorso}>
        <Modal.Title className="d-flex align-items-center">
          <span className="me-2">{currentConfig.icona}</span>
          {currentConfig.titolo}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="text-center py-4">
        <p className="mb-3 fs-5">
          <strong>{currentConfig.messaggio}</strong>
        </p>
        
        <small className="text-warning">
          <strong>⚠️</strong> {currentConfig.avviso}
        </small>
      </Modal.Body>
      
      <Modal.Footer className="justify-content-center">
        <Button 
          variant="outline-secondary" 
          onClick={onAnnulla}
          disabled={caricamentoInCorso}
          className="me-3"
        >
          Annulla
        </Button>
        <Button 
          variant="success" 
          onClick={onConferma}
          disabled={caricamentoInCorso}
        >
          {caricamentoInCorso ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              {currentConfig.pulsanteCaricamento}
            </>
          ) : (
            currentConfig.pulsanteConferma
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ConfermaAzione;
