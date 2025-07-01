import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import ListaCompiti from "../ListaCompiti";
import LoadingSpinner from "../utils/LoadingSpinner";
import ConfermaSuccesso from "../utils/ConfermaSuccesso";
import { useAuth } from "../../AuthContext";
import API from "../../API";

function StudenteDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [compiti, setCompiti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStato, setFiltroStato] = useState("aperto");
  const [conferma, setConferma] = useState({});

  useEffect(() => {
    const caricaCompiti = async () => {
      setLoading(true);
      try {
        const stato = filtroStato === "tutti" ? null : filtroStato;
        const response = await API.ottieniCompitiStudente(stato);
        setCompiti(response.compiti);
      } catch (error) {
        console.error("Errore nel caricamento compiti:", error);
        setCompiti([]);
      }
      setLoading(false);
    };

    caricaCompiti();
  }, [filtroStato]);

  //gestione della conferma dopo le operazioni di assegnazione da DettaglioCompito e valutazione compito
  useEffect(() => {
    if(location.state?.conferma) {

      setConferma({
        mostra: true,
        tipo: location.state.conferma,
        messaggio: location.state.messaggio || 'Operazione completata!'
      });
      
      // rimuove lo stato per evitare che si ripeta alla navigazione
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname]);

  // naviga alla pagina di risposta
  const handleApriRisposta = (compito) => {
    navigate(`/studente/compiti/${compito.id}/rispondi`, { 
      state: { daDettaglio: false } 
    });
  };

  // cambia pagina al dettaglio del compito
  const handleApriDettaglio = (compitoId) => {
    navigate(`/studente/compiti/${compitoId}`);
  };

  // gestione del filtro
  const handleCambioFiltro = (nuovoFiltro) => {
    setFiltroStato(nuovoFiltro);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container my-3">
      {/* breadcrumb compatto iniziale */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item active">📚 I miei Compiti</li>
        </ol>
      </nav>

      <ListaCompiti
        compiti={compiti}
        filtroStato={filtroStato}
        onFiltroChange={handleCambioFiltro}
        onApriDettaglio={handleApriDettaglio}
        onApriRisposta={handleApriRisposta}
      />

      <div className="d-flex justify-content-center mt-3 mb-3">
        <div
          className="card border-top shadow-sm px-3 py-2"
          style={{
            minWidth: "280px",
            width: "98%",
          }}
        >
          <div className="row text-center small">
            <div className="col">
              <div className="d-flex flex-column">
                <span className="fw-semibold text-primary">
                  {compiti.filter((c) => c.stato === "aperto").length}
                </span>
                <small className="text-muted">Compiti aperti</small>
              </div>
            </div>
            <div className="col">
              <div className="d-flex flex-column">
                <span className="fw-semibold text-warning">
                  {
                    compiti.filter((c) => c.stato === "aperto" && !c.ha_risposta)
                      .length
                  }
                </span>
                <small className="text-muted">Compiti da completare</small>
              </div>
            </div>
            <div className="col">
              <div className="d-flex flex-column">
                <span className="fw-semibold text-secondary">
                  {compiti.filter((c) => c.stato === "chiuso").length}
                </span>
                <small className="text-muted">Compiti chiusi</small>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfermaSuccesso {...conferma} onChiudi={() => setConferma({})} />
    </div>
  );
}

export default StudenteDashboard;