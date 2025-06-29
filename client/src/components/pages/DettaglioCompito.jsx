import { useParams, useNavigate, useSearchParams } from 'react-router';
import { useState, useEffect } from 'react';
import LoadingSpinner from '../utils/LoadingSpinner.jsx';
import CreaCompito from '../CreaCompito.jsx';
import API from '../../API';

function DettaglioCompitoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [compito, setCompito] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // gestione stati modali tramite URL params
  const modalParam = searchParams.get('modal');
  const mostraAssegnaAltroGruppo = modalParam === 'assegna';

  useEffect(() => {
    const caricaCompito = async () => {
      setLoading(true);
      setError(null);
      try {
        const compitoData = await API.ottieniCompitoDettaglioDocente(id);
        setCompito(compitoData);
      } catch (error) {
        //console.error('Errore nel caricamento del compito:', error);
        setError(error.message || 'Errore nel caricamento del compito');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      caricaCompito();
    }
  }, [id]);
  
  const apriValutazione = () => {
    navigate(`/docente/compiti/${id}/valutazione`, {
      state: { daDettaglio: true },
    });
    
  };
// gestore per aprire il modale di assegnazione ad un altro gruppo
  const apriAssegnaAltroGruppo = () => {
    setSearchParams({ modal: 'assegna' });
  };

  const chiudiModali = () => {
    setSearchParams({});
  };
  
  const handleCompitoAssegnato = (nuovoCompito) => {
    chiudiModali();
    navigate(`/docente/compiti`);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="alert alert-danger m-3">Errore: {error}</div>;
  if (!compito) return <div className="alert alert-warning m-3">Compito non trovato</div>;

  return (
    <div className="container my-3">
      {/* breadcrumb compatto */}
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
          <li className="breadcrumb-item active">📋 #{compito.id}</li>
        </ol>
      </nav>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">📋 Dettaglio Compito</h4>
        <button 
          className="btn btn-outline-secondary btn-sm"
          onClick={() => navigate('/docente/compiti')}
        >
          ← Torna alla lista
        </button>
      </div>

      <DettaglioCompito
        compito={compito}
        onApriValutazione={apriValutazione}
        onAssegnaAltroGruppo={apriAssegnaAltroGruppo}
      />

      {/* modale per assegnare il compito ad un altro Gruppo */}
      {mostraAssegnaAltroGruppo && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog" style={{ maxWidth: '1400px' }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">📋 Assegna Compito ad un altro Gruppo</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={chiudiModali}
                ></button>
              </div>
              <div className="modal-body p-0">
                <CreaCompito
                  onCompitoCreato={handleCompitoAssegnato}
                  onCancella={chiudiModali}
                  datiIniziali={{ traccia: compito.traccia }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente distinto per il contenuto del compito
function DettaglioCompito({ compito, onApriValutazione, onAssegnaAltroGruppo }) {
  return (
    <div className="card">
      <div className="card-body p-3">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className="flex-grow-1 me-3">
            <div className="d-flex align-items-center gap-2 mb-2">
              <strong className="text-muted" style={{ fontSize: '0.9rem' }}>Traccia:</strong>
              <span
                className={`badge bg-${
                  compito.stato === "aperto" ? "success" : "secondary"
                } ms-auto`}
              >
                {compito.stato === "aperto" ? "🟢 Aperto" : "🔴 Chiuso"}
              </span>
            </div>
            <div className="bg-light border rounded p-2">
              <p className="mb-0" style={{ fontSize: '0.95rem' }}>{compito.traccia}</p>
            </div>
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-md-6">
            <small className="text-muted">Data: </small>
            <span style={{ fontSize: '0.9rem' }}>{compito.creato_il}</span>
          </div>
          <div className="col-md-6">
            <small className="text-muted">Gruppo: </small>
            <span style={{ fontSize: '0.9rem' }}>{compito.gruppo.map(utente => `${utente.nome} ${utente.cognome}`).join(", ")}</span>
          </div>
        </div>

        {compito.risposta ? (
          <div className="border rounded p-3 bg-light d-flex flex-column" style={{ minHeight: "120px" }}>
            <div className="mb-2">
              <h6 className="mb-1" style={{ fontSize: '1rem' }}>👥 Risposta del gruppo</h6>
              <small className="text-muted">
                📅 {compito.risposta.aggiornato_il}
                {compito.risposta.inviato_da && (
                  <span className="ms-2">• Inviata da: <strong>{compito.risposta.inviato_da.nome} {compito.risposta.inviato_da.cognome}</strong></span>
                )}
              </small>
            </div>
            
            <div style={{ fontSize: '0.95rem' }} className="flex-grow-1">{compito.risposta.testo}</div>
            
            <div className="d-flex justify-content-end mt-auto pt-2">
              {compito.stato !== "chiuso" && (
                <>
                  {compito.punteggio !== null && compito.punteggio !== undefined ? (
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-primary">
                        Punteggio: {compito.punteggio}/30
                      </span>
                      <button
                        className="btn btn-outline-success btn-sm"
                        onClick={() => onApriValutazione(compito)}
                      >
                        ✏️ Valuta
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn-outline-success"
                      onClick={() => onApriValutazione(compito)}
                    >
                      📊 Valuta
                    </button>
                  )}
                </>
              )}
              
              {compito.stato === "chiuso" && compito.punteggio !== null && compito.punteggio !== undefined && (
                <span className="badge bg-secondary">
                  Punteggio finale: {compito.punteggio}/30
                </span>
              )}
            </div>
          </div>
        ) : (
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
        )}

        <div className="d-flex justify-content-end pt-2 border-top">
          <button 
            className="btn btn-outline-secondary btn-sm"
            onClick={onAssegnaAltroGruppo}
          >
            ᯓ➤ Assegna ad un altro gruppo
          </button>
        </div>
      </div>
    </div>
  );
}

export default DettaglioCompitoPage;