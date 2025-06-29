import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import ListaCompiti from "../ListaCompiti";
import RispostaCompito from "../RispostaCompito";
import LoadingSpinner from "../utils/LoadingSpinner";
import { useAuth } from "../../AuthContext";
import API from "../../API";

function StudenteDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [compiti, setCompiti] = useState([]);
  const [loading, setLoading] = useState(true);
  // compito attualmente selezionato per aggiungere la risposta dallo studente
  const [compitoPerRisposta, setCompitoPerRisposta] = useState(null);
  const [filtroStato, setFiltroStato] = useState("tutti");

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

  // Effect per gestire i parametri URL
  useEffect(() => {
    const modalParam = searchParams.get('modal');
    const compitoIdParam = searchParams.get('compitoId');

    if (modalParam === 'risposta' && compitoIdParam && compiti.length > 0) {
      const compito = compiti.find(c => c.id === parseInt(compitoIdParam));
      if (compito) {
        setCompitoPerRisposta(compito);
      }
    }
  }, [searchParams, compiti]);

  // FUNZIONI PER LA RISPOSTA -------------------
  const handleApriRisposta = (compito) => {
    setSearchParams({ modal: 'risposta', compitoId: compito.id.toString() });
  };

  const handleSalvaRisposta = async (testoRisposta) => {
    try {
      const result = await API.aggiornaRispostaCompito(compitoPerRisposta.id, testoRisposta);

      // aggiorna lo stato locale del compito con la nuova risposta
      setCompiti((prev) =>
        prev.map((c) =>
          c.id === compitoPerRisposta.id
            ? {
                ...c,
                risposta: {
                  testo: testoRisposta,
                  aggiornato_il: result.aggiornato_il,
                  inviato_da: user,
                },
              }
            : c
        )
      );

      // chiude il modale e pulisce l'URL
      setCompitoPerRisposta(null);
      setSearchParams({});
    } catch (error) {
      throw error; // rilancia l'errore per gestirlo nel modale
    }
  };

  const handleCancellaRisposta = () => {
    setCompitoPerRisposta(null);
    setSearchParams({});
  };

  // ----------------------------------------------

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

      <div
        className="fixed-bottom d-flex justify-content-center mb-3"
        style={{ pointerEvents: "none" }} // evita click non voluti sotto
      >
        <div
          className="card border-top shadow-sm px-3 py-2"
          style={{
            minWidth: "280px",
            width: "82%",
            pointerEvents: "auto",
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
                <span className="fw-semibold text-success">
                  {
                    compiti.filter(
                      (c) => c.risposta?.inviato_da?.id === user.id
                    ).length
                  }
                </span>
                <small className="text-muted">Risposte inviate</small>
              </div>
            </div>
            <div className="col">
              <div className="d-flex flex-column">
                <span className="fw-semibold text-warning">
                  {
                    compiti.filter((c) => c.stato === "aperto" && !c.risposta)
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

      {/* modale per inserire/modificare la risposta */}
      {compitoPerRisposta && (
        <RispostaCompito
          compito={compitoPerRisposta}
          onSalva={handleSalvaRisposta}
          onCancella={handleCancellaRisposta}
        />
      )}
    </div>
  );
}

export default StudenteDashboard;