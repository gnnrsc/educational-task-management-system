import { useParams, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import LoadingSpinner from "../utils/LoadingSpinner.jsx";
import { useAuth } from "../../AuthContext";
import API from "../../API";

function DettaglioCompitoStudentePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [compito, setCompito] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const caricaCompito = async () => {
      setLoading(true);
      setError(null);
      try {
        const compitoData = await API.ottieniCompitoDettaglioStudente(id);
        setCompito(compitoData);
      } catch (error) {
        setError(error.message || "Errore nel caricamento del compito");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      caricaCompito();
    }
  }, [id]);

  // Naviga alla pagina di risposta
  const handleApriRisposta = (compito) => {
    navigate(`/studente/compiti/${compito.id}/risposta`, {
      state: { daDettaglio: true },
    });
  };

  if (loading) return <LoadingSpinner />;
  if (error)
    return <div className="alert alert-danger m-3">Errore: {error}</div>;
  if (!compito)
    return <div className="alert alert-warning m-3">Compito non trovato</div>;

  return (
    <div className="container my-3">
      {/* breadcrumb compatto */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item">
            <button
              className="btn btn-link p-0 text-decoration-none"
              onClick={() => navigate("/studente/compiti")}
            >
              📚 I miei Compiti
            </button>
          </li>
          <li className="breadcrumb-item active">📋 #{compito.id}</li>
        </ol>
      </nav>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">📋 Dettaglio Compito</h4>
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={() => navigate("/studente/compiti")}
        >
          ← Torna ai miei compiti
        </button>
      </div>

      <DettaglioCompitoStudente
        compito={compito}
        utenteCorrente={user}
        onApriRisposta={handleApriRisposta}
      />
    </div>
  );
}

// Componente distinto per il contenuto del compito studente
function DettaglioCompitoStudente({ compito, utenteCorrente, onApriRisposta }) {
  // Calcola se l'utente corrente ha inviato la risposta
  const haInviatoRisposta = compito.risposta?.inviato_da?.id === utenteCorrente.id;

  // Calcola se può modificare la risposta (compito aperto)
  const puoModificareRisposta = compito.stato === "aperto";

  return (
    <div className="card">
      <div className="card-body p-3">
        {/* Header del compito */}
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className="flex-grow-1 me-3">
            <div className="d-flex align-items-center gap-2 mb-2">
              <strong className="text-muted" style={{ fontSize: "0.9rem" }}>
                Traccia:
              </strong>
              <span
                className={`badge bg-${
                  compito.stato === "aperto" ? "success" : "secondary"
                } ms-auto`}
              >
                {compito.stato === "aperto" ? "🟢 Aperto" : "🔴 Chiuso"}
              </span>
            </div>
            <div className="bg-light border rounded p-3">
              <p className="mb-0" style={{ fontSize: "0.95rem" }}>
                {compito.traccia}
              </p>
            </div>
          </div>
        </div>

        {/* Informazioni del compito - tutto su una linea */}
        <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
          <div className="d-flex align-items-center gap-1">
            <small className="text-muted">Data assegnazione:</small>
            <span style={{ fontSize: "0.9rem" }}>{compito.creato_il}</span>
          </div>

          <div className="d-flex align-items-center gap-1">
            <small className="text-muted">Docente:</small>
            <span style={{ fontSize: "0.9rem" }}>
              {compito.docente
                ? `${compito.docente.nome} ${compito.docente.cognome}`
                : "N/A"}
            </span>
          </div>

          <div className="d-flex align-items-center gap-1">
            <small className="text-muted">
              Gruppo ({compito.gruppo?.length || 0} studenti):
            </small>
            <div className="d-flex flex-wrap gap-1">
              {compito.gruppo?.map((membro) => (
                <span
                  key={membro.id}
                  className={`badge ${
                    membro.id === utenteCorrente.id
                      ? "bg-primary"
                      : "bg-light text-dark border"
                  }`}
                  style={{ fontSize: "0.75rem" }}
                >
                  {membro.id === utenteCorrente.id ? "👤 " : ""}
                  {membro.nome} {membro.cognome}
                  {membro.id === utenteCorrente.id ? " (Tu)" : ""}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Sezione risposta */}
        {compito.risposta ? (
          <div
            className="border rounded p-3 bg-light d-flex flex-column"
            style={{ minHeight: "120px" }}
          >
            <div className="mb-2">
              <h6 className="mb-1" style={{ fontSize: "1rem" }}>
                👥 Risposta del gruppo
                {haInviatoRisposta && (
                  <span className="badge bg-success ms-2">✓ Inviata da te</span>
                )}
              </h6>
              <small className="text-muted">
                📅 {compito.risposta.aggiornato_il}
                {compito.risposta.inviato_da && (
                  <span className="ms-2">
                    • Inviata da:{" "}
                    <strong>
                      {compito.risposta.inviato_da.id === utenteCorrente.id
                        ? "Te"
                        : `${compito.risposta.inviato_da.nome} ${compito.risposta.inviato_da.cognome}`}
                    </strong>
                  </span>
                )}
              </small>
            </div>

            <div style={{ fontSize: "0.95rem" }} className="flex-grow-1">
              {compito.risposta.testo}
            </div>

            {/* Azioni sulla risposta */}
            <div className="d-flex justify-content-end align-items-center gap-2 mt-auto pt-2">
              {compito.stato === "chiuso" &&
                compito.punteggio !== null &&
                compito.punteggio !== undefined && (
                  <span className="badge bg-secondary fs-6">
                    📊 Punteggio ricevuto: {compito.punteggio}/30
                  </span>
                )}
              {puoModificareRisposta && (
                <button
                  className="btn btn-outline-warning"
                  onClick={() => onApriRisposta(compito)}
                >
                  ✏️ Modifica risposta
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="alert alert-warning py-3 mb-3">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <span className="me-2">📝</span>
                <div>
                  <strong style={{ fontSize: "0.95rem" }}>
                    Nessuna risposta inviata
                  </strong>
                  <br />
                  <small>
                    Il gruppo non ha ancora inviato una risposta per questo
                    compito.
                  </small>
                </div>
              </div>
              {puoModificareRisposta && (
                <button
                  className="btn btn-success"
                  onClick={() => onApriRisposta(compito)}
                >
                  📝 Inserisci risposta
                </button>
              )}
            </div>
          </div>
        )}

        {/* Stato del compito */}
        {compito.stato === "chiuso" && (
          <div className="alert alert-info py-2 mb-0">
            <div className="d-flex align-items-center justify-content-center text-center">
              <div>
                <strong style={{ fontSize: "0.95rem" }}>
                  🔒 Compito chiuso
                </strong>
                <br />
                <small>
                  Questo compito è stato valutato dal docente e non può più
                  essere modificato.
                </small>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DettaglioCompitoStudentePage;