import { useState, useEffect } from "react";
import LoadingSpinner from "./utils/LoadingSpinner";
import API from "../API";

function TabellaStudenti({ ordinamento }) {
  const [studenti, setStudenti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStatoClasse();
  }, [ordinamento]);

  const loadStatoClasse = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.getStatisticheClasse(ordinamento);
      setStudenti(response.studenti);
    } catch (error) {
      //console.error("Errore nel caricamento stato classe:", error);
      setError(error.message || "Errore nel caricamento dei dati");
      setStudenti([]);
    }
    setLoading(false);
  };

  const getMediaColor = (media) => {
    if (media === null || media === undefined) return "text-muted";
    if (media >= 24) return "text-success";
    if (media >= 18) return "text-warning";
    return "text-danger";
  };

  const getMediaLabel = (media) => {
    if (media === null || media === undefined) return "N/A";
    if (media >= 27) return "Eccezionale";
    if (media >= 24) return "Eccellente";
    if (media >= 21) return "Buono";
    if (media >= 18) return "Sufficiente";
    return "Insufficiente";
  };

  if (loading) {
    return (
      <div className="card" style={{ height: "644px" }}>
        <div className="card-body text-center py-5">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">Errore: {error}</div>;
  }

  return (
    <>
      {/* tabella studenti */}
      <div className="card">
        <div className="card-body p-0">
          <div
            className="table-responsive"
            style={{
              maxHeight: "500px",
              overflowY: "auto",
              borderRadius: "0.5rem",
            }}
          >
            <table className="table table-hover align-middle mb-0">
              <thead
                className="table-light"
                style={{ position: "sticky", top: 0, zIndex: 1 }}
              >
                <tr>
                  <th style={{ width: "30%" }}>Studente</th>
                  <th className="text-center">Totale Compiti</th>
                  <th className="text-center">Aperti</th>
                  <th className="text-center">Chiusi</th>
                  <th className="text-center">Media Voti</th>
                  <th className="text-center">Valutazione</th>
                </tr>
              </thead>
              <tbody>
                {studenti.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">
                      <div className="d-flex flex-column align-items-center">
                        <span
                          style={{ fontSize: "2rem", marginBottom: "0.5rem" }}
                        >
                          👥
                        </span>
                        <strong>Nessuno studente trovato</strong>
                        <small>Non ci sono studenti da visualizzare</small>
                      </div>
                    </td>
                  </tr>
                ) : (
                  studenti.map((item, index) => (
                    <tr key={item.studente.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="me-3">
                            <div
                              className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                              style={{
                                width: "35px",
                                height: "35px",
                                fontSize: "0.9rem",
                              }}
                            >
                              {item.studente.nome[0]}
                              {item.studente.cognome[0]}
                            </div>
                          </div>
                          <div>
                            <strong>
                              {item.studente.cognome} {item.studente.nome}
                            </strong>
                          </div>
                        </div>
                      </td>
                      <td className="text-center">
                        <span
                          className="badge bg-info text-white px-3 py-2"
                          style={{ fontSize: "0.9rem" }}
                        >
                          {item.totale_compiti}
                        </span>
                      </td>
                      <td className="text-center">
                        <span
                          className="badge bg-success px-3 py-2"
                          style={{ fontSize: "0.9rem" }}
                        >
                          🟢 {item.compiti_aperti}
                        </span>
                      </td>
                      <td className="text-center">
                        <span
                          className="badge bg-secondary px-3 py-2"
                          style={{ fontSize: "0.9rem" }}
                        >
                          🔴 {item.compiti_chiusi}
                        </span>
                      </td>
                      <td className="text-center">
                        <div>
                          <strong
                            className={`${getMediaColor(item.media)}`}
                            style={{ fontSize: "1.1rem" }}
                          >
                            {item.media !== null && item.media !== undefined
                              ? `${item.media.toFixed(2)}/30`
                              : "N/A"}
                          </strong>
                        </div>
                      </td>
                      <td className="text-center">
                        {item.media !== null && item.media !== undefined ? (
                          <span
                            className={`badge px-2 py-1 ${
                              item.media >= 24
                                ? "bg-success-subtle text-success"
                                : item.media >= 18
                                ? "bg-warning-subtle text-warning"
                                : "bg-danger-subtle text-danger"
                            }`}
                            style={{ fontSize: "0.8rem" }}
                          >
                            {getMediaLabel(item.media)}
                          </span>
                        ) : (
                          <span
                            className="badge bg-light text-muted px-2 py-1"
                            style={{ fontSize: "0.8rem" }}
                          >
                            Nessun voto
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* statistiche generali */}
      {studenti.length > 0 && (
        <div className="row mt-4">
          <div className="col-md-3">
            <div className="card bg-primary text-white">
              <div className="card-body text-center">
                <h5 className="card-title mb-1">👥</h5>
                <h3 className="mb-0">{studenti.length}</h3>
                <small>Studenti totali</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-success text-white">
              <div className="card-body text-center">
                <h5 className="card-title mb-1">📊</h5>
                <h3 className="mb-0">
                  {(
                    studenti
                      .filter((s) => s.media !== null && s.media !== undefined)
                      .reduce((acc, s) => acc + s.media, 0) /
                    studenti.filter(
                      (s) => s.media !== null && s.media !== undefined
                    ).length
                  ).toFixed(1)}
                </h3>
                <small>Media classe</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-info text-white">
              <div className="card-body text-center">
                <h5 className="card-title mb-1">⭐</h5>
                <h3 className="mb-0">
                  {studenti.filter((s) => s.media >= 24).length}
                </h3>
                <small>Eccellenti (≥24)</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-danger text-white">
              <div className="card-body text-center">
                <h5 className="card-title mb-1">⚠️</h5>
                <h3 className="mb-0">
                  {
                    studenti.filter((s) => s.media !== null && s.media < 18)
                      .length
                  }
                </h3>
                <small>Insufficienti (&lt;18)</small>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TabellaStudenti;
