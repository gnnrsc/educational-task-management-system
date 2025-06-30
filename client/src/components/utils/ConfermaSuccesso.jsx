import { useState, useEffect } from 'react';

function ConfermaSuccesso({ 
  mostra, 
  onChiudi, 
  tipo = 'successo',
  messaggio = '',
  durata = 4000 
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (mostra) {
      setVisible(true);
      
      const timer = setTimeout(() => {
        handleChiudi();
      }, durata);
      
      return () => clearTimeout(timer);
    }
  }, [mostra, durata]);

  const handleChiudi = () => {
    setVisible(false);
    setTimeout(() => {
      onChiudi?.();
    }, 300);
  };

  const getConfig = () => {
    const configs = {
      'compito-creato': { icona: '✅', titolo: 'Compito Creato!', colore: 'success' },
      'compito-assegnato': { icona: '📤', titolo: 'Compito Assegnato!', colore: 'success' },
      'valutazione-completata': { icona: '📝', titolo: 'Valutazione Completata!', colore: 'success' },
      'risposta-inviata': { icona: '📬', titolo: 'Risposta Inviata!', colore: 'success' },
      'risposta-modificata': { icona: '✏️', titolo: 'Risposta Modificata!', colore: 'success' },
      'errore': { icona: '❌', titolo: 'Si è verificato un errore!', colore: 'danger' },
      'successo': { icona: '✅', titolo: 'Completato!', colore: 'success' }
    };
    
    return configs[tipo] || configs['successo'];
  };

  const { icona, titolo, colore } = getConfig();
  const isErrore = colore === 'danger';

  if (!mostra && !visible) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className={`modal-backdrop fade ${visible ? 'show' : ''}`}
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          zIndex: 1055 
        }}
      />
      
      {/* Modal */}
      <div
        className={`modal fade ${visible ? 'show d-block' : ''}`}
        style={{ zIndex: 1056 }}
      >
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content border-0 shadow-lg rounded-4">
            <div className="modal-body text-center p-4">
              {/* Icona */}
              <div 
                className="mb-3"
                style={{ fontSize: '3rem' }}
              >
                {icona}
              </div>
              
              {/* Titolo */}
              <h5 className={`mb-3 fw-bold text-${colore}`}>
                {titolo}
              </h5>
              
              {/* Messaggio */}
              {messaggio && (
                <p className="text-muted mb-3 small">
                  {messaggio}
                </p>
              )}
              
              {/* Pulsante */}
              <button
                type="button"
                className={`btn btn-${colore} px-4`}
                onClick={handleChiudi}
              >
                {isErrore ? 'OK' : 'Perfetto'}
              </button>
              
              {/* Progress bar semplificata */}
              <div className="mt-3">
                <div className="progress" style={{ height: '2px' }}>
                  <div 
                    className={`progress-bar bg-${colore}`}
                    style={{ 
                      width: '100%',
                      transition: `width ${durata}ms linear`,
                      animation: `width-countdown ${durata}ms linear forwards`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* CSS inline */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes width-countdown {
            from { width: 100%; }
            to { width: 0%; }
          }
        `
      }} />
    </>
  );
}

export default ConfermaSuccesso;