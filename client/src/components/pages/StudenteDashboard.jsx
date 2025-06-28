import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import ListaCompiti from "../ListaCompiti";
import RispostaCompito from "../RispostaCompito";
import LoadingSpinner from "../utils/LoadingSpinner";
import { useAuth } from "../../AuthContext";
import API from "../../API";

function StudenteDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [compiti, setCompiti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [compitoPerRisposta, setCompitoPerRisposta] = useState(null);
  const [filtroStato, setFiltroStato] = useState("tutti");

  useEffect(() => {
    loadCompiti();
  }, [filtroStato]);

  const loadCompiti = async () => {
    setLoading(true);
    try {
      const stato = filtroStato === "tutti" ? null : filtroStato;
      const response = await API.getCompitiStudente(stato);

      // la risposta contiene { filtro, totale, compiti }
      setCompiti(response.compiti);
    } catch (error) {
      console.error("Errore nel caricamento compiti:", error);
      setCompiti([]);
    }
    setLoading(false);
  };

  // FUNZIONI PER LA RISPOSTA -------------------
  const handleOpenRisposta = (compito) => {
    setCompitoPerRisposta(compito);
  };

  const handleSaveRisposta = async (testoRisposta) => {
    try {
      const result=await API.updateRispostaCompito(compitoPerRisposta.id, testoRisposta);

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

      // chiude il modale
      setCompitoPerRisposta(null);
    } catch (error) {
      throw error; // rilancia l'errore per gestirlo nel modale
    }
  };

  const handleCancelRisposta = () => {
    setCompitoPerRisposta(null);
  };

  // ----------------------------------------------

  // cambia pagina al dettaglio del compito
  const handleOpenDettaglio = (compitoId) => {
    navigate(`/studente/compiti/${compitoId}`);
  };

  // gestione del filtro
  const handleFiltroChange = (nuovoFiltro) => {
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
        onFiltroChange={handleFiltroChange}
        onOpenDettaglio={handleOpenDettaglio}
        onOpenRisposta={handleOpenRisposta}
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
          onSave={handleSaveRisposta}
          onCancel={handleCancelRisposta}
        />
      )}
    </div>
  );
}

export default StudenteDashboard;
