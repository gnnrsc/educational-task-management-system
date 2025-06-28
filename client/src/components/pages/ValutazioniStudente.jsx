import { useState, useEffect } from "react";
import API from "../../API";
import LoadingSpinner from "../utils/LoadingSpinner";

function ValutazioniStudente() {
  const [compiti, setCompiti] = useState([]);
  //stato per i dati della media dello studente
  const [mediaData, setMediaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ordinamento, setOrdinamento] = useState('recente');

  useEffect(() => {
    const loadDatiStudente = async () => {
      setLoading(true);
      try {
        const [responseMedia, responseCompiti] = await Promise.all([
          API.ottieniMediaStudente(),
          API.ottieniCompitiStudente('chiuso')
        ]);

        setMediaData(responseMedia);
        
        const compitiConPunteggio = responseCompiti.compiti.filter(c => 
          c.punteggio !== null && c.punteggio !== undefined
        );
        setCompiti(compitiConPunteggio);
      } catch (error) {
        //console.error("Errore nel caricamento dati:", error);
        setCompiti([]);
        setMediaData(null);
      } finally {
        setLoading(false);
      }
    };

    loadDatiStudente();
  }, []);

  const handleOrdinamentoCambia = (nuovoOrdinamento) => {
    setOrdinamento(nuovoOrdinamento);
  };



  // Ordina i compiti in base al filtro selezionato
  const compitiOrdinati = [...compiti].sort((a, b) => {
    switch (ordinamento) {
      case 'recente':
        return new Date(b.creato_il) - new Date(a.creato_il);
      case 'antico':
        return new Date(a.creato_il) - new Date(b.creato_il);
      case 'punteggio_alto':
        return b.punteggio - a.punteggio;
      case 'punteggio_basso':
        return a.punteggio - b.punteggio;
      default:
        return 0;
    }
  });

  // Funzione per ottenere il colore del badge in base al punteggio
  const getBadgeClass = (punteggio) => {
    if (punteggio >= 27) return 'bg-success text-white';
    if (punteggio >= 24) return 'bg-primary text-white';
    if (punteggio >= 21) return 'bg-info text-white';
    if (punteggio >= 18) return 'bg-warning text-dark';
    return 'bg-danger text-white';
  };

  // Funzione per ottenere la descrizione del voto
  const getDescrizioneVoto = (punteggio) => {
    if (punteggio >= 27) return 'Eccezionale';
    if (punteggio >= 24) return 'Eccellente';
    if (punteggio >= 21) return 'Buono';
    if (punteggio >= 18) return 'Sufficiente';
    return 'Insufficiente';
  };

  if (loading) return <LoadingSpinner />;

  const media = mediaData?.media || 0;
  const totaleCompiti = mediaData?.totale_compiti || 0;

  return (
    <div className="container my-3">
      {/* breadcrumb compatto iniziale */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item active">
            📊 Le mie Valutazioni
          </li>
        </ol>
      </nav>

      {/* Statistiche principali */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body py-3">
              <h5 className="card-title text-primary mb-1">{totaleCompiti}</h5>
              <small className="text-muted">Compiti con valutazione</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body py-3">
              <h5 className={`card-title mb-1 ${getBadgeClass(parseFloat(media)).includes('bg-') ? 'text-success' : 'text-primary'}`}>
                {media.toFixed(2)}
              </h5>
              <small className="text-muted">Media voti</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body py-3">
              <h5 className="card-title text-success mb-1">
                {compiti.filter(c => c.punteggio >= 24).length}
              </h5>
              <small className="text-muted">Voti eccellenti</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body py-3">
              <h5 className="card-title text-warning mb-1">
                {compiti.filter(c => c.punteggio < 18).length}
              </h5>
              <small className="text-muted">Voti insufficienti</small>
            </div>
          </div>
        </div>
      </div>

      {/* Filtri ordinamento */}
      <div className="d-flex flex-wrap gap-3 mb-4 align-items-center">
        <div>
          <label className="fw-semibold me-2">Ordina per:</label>
          {[
            { value: 'recente', label: 'Compiti più recenti' },
            { value: 'antico', label: 'Compiti meno recenti' },
            { value: 'punteggio_alto', label: 'Punteggio alto' },
            { value: 'punteggio_basso', label: 'Punteggio basso' }
          ].map((opzione) => (
            <button
              key={opzione.value}
              onClick={() => handleOrdinamentoCambia(opzione.value)}
              className={`btn btn-sm me-1 ${
                ordinamento === opzione.value
                  ? "btn-outline-primary active"
                  : "btn-outline-secondary"
              }`}
            >
              {opzione.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabella compiti */}
      {totaleCompiti === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <div className="text-muted">
              <span style={{ fontSize: "3rem", marginBottom: "1rem", display: "block" }}>
                📊
              </span>
              <h5>Nessun compito valutato</h5>
              <p className="mb-0">
                Non hai ancora compiti chiusi con punteggi assegnati.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="table-responsive"
          style={{
            maxHeight: "400px",
            overflowY: "scroll",
            borderRadius: "0.5rem",
          }}
        >
          <table className="table table-hover align-middle mb-0">
            <thead
              className="table-light"
              style={{ position: "sticky", top: 0, zIndex: 1 }}
            >
              <tr>
                <th style={{ width: "50%" }}>Traccia</th>
                <th>Data</th>
                <th>Punteggio</th>
                <th>Valutazione</th>
              </tr>
            </thead>
            <tbody>
              {compitiOrdinati.map((compito) => (
                <tr key={compito.id}>
                  <td style={{ width: "50%" }}>
                    <div className="d-flex flex-column">
                      <strong className="mb-1">
                        {compito.traccia.length > 70
                          ? compito.traccia.slice(0, 70) + "..."
                          : compito.traccia}
                      </strong>
                      <small className="text-muted">
                        Docente: {compito.docente ? 
                          `${compito.docente.nome} ${compito.docente.cognome}` : 
                          'N/A'
                        }
                      </small>
                    </div>
                  </td>
                  <td>
                    <div className="d-flex flex-column">
                      <span>{compito.creato_il}</span>
                      <small className="text-muted">
                        Gruppo: {compito.numero_studenti} studenti
                      </small>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge px-3 py-2 rounded-pill fs-6 ${getBadgeClass(compito.punteggio)}`}
                    >
                      {compito.punteggio}/30
                    </span>
                  </td>
                  <td>
                    <div className="d-flex flex-column">
                      <span className="fw-semibold">
                        {getDescrizioneVoto(compito.punteggio)}
                      </span>
                      <small className="text-muted">
                        {compito.punteggio >= 27 ? '🏆' : 
                         compito.punteggio >= 24 ? '⭐' :
                         compito.punteggio >= 21 ? '👍' :
                         compito.punteggio >= 18 ? '✅' : '❌'}
                      </small>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legenda */}
      <div className="mt-2">
        <div className="card">
          <div className="card-body">
            <h6 className="card-title mb-3">📖 Legenda Valutazioni</h6>
            <div className="row">
              <div className="col-md-6">
                <small className="text-muted">
                  <strong>🎯 Scala di valutazione:</strong><br/>
                  • 27-30: Eccezionale 🏆<br/>
                  • 24-26: Eccellente ⭐<br/>
                  • 21-23: Buono 👍<br/>
                  • 18-20: Sufficiente ✅<br/>
                  • 0-17: Insufficiente ❌
                </small>
              </div>
              <div className="col-md-6">
                <small className="text-muted">
                  <strong>📊 Le tue statistiche:</strong><br/>
                  • Compiti con valutazione: numero totale di compiti con punteggio<br/>
                  • Media voti: media aritmetica di tutti i punteggi<br/>
                  • Voti eccellenti: punteggi da 24 a 30<br/>
                  • Voti insufficienti: punteggi sotto il 18
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ValutazioniStudente;