import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import ListaCompiti from "../../ListaCompiti";
import LoadingSpinner from "../../utils/LoadingSpinner";
import ConfermaSuccesso from "../../utils/ConfermaSuccesso";
import API from "../../../API";

function StudenteDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  
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

  //gestione della conferma dopo le operazioni di assegnazione da DettaglioCompitoStudente e valutazione compito
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
      <ConfermaSuccesso {...conferma} onChiudi={() => setConferma({})} />
    </div>
  );
}

export default StudenteDashboard;