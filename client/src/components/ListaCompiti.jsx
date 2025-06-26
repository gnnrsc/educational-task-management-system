import { useState, useEffect } from "react";

function ListaCompiti({
  compiti, filtroStato, onFiltroChange,
  onOpenDettaglio, onOpenValutazione, onAssegnaAltroGruppo,
}) {

  //stato per gestire il menu a tendina per copiare il compito
  const [menuApertoId, setMenuApertoId] = useState(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".menu-kebab-trigger")) {
        setMenuApertoId(null);
      }
    };
    //ascolta tutti i click che avvengono ovunque nella pagina e chiama la funzione handleClickOutside
    document.addEventListener("click", handleClickOutside);
    //cleanup per rimuovere il listener al momento della dismount del componente
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="container py-3">
      <div className="d-flex flex-wrap gap-3 mb-4 align-items-center">
        <div>
          <label className="fw-semibold me-2">Filtra per stato:</label>
          {["aperto", "chiuso", "tutti"].map((f) => (
            <button
              key={f}
              onClick={() => onFiltroChange(f)}
              className={`btn btn-sm me-1 ${
                filtroStato === f
                  ? "btn-outline-primary active"
                  : "btn-outline-secondary"
              }`}
            >
              {/* A               + perto*/}
              {f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div
        className="table-responsive"
        style={{
          maxHeight: "410px",
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
              <th style={{ width: "40%" }}>Traccia</th>
              <th>Gruppo</th>
              <th>Data</th>
              <th>Stato</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {compiti.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4 text-muted">
                  <div className="d-flex flex-column align-items-center">
                    <span style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📝</span>
                    <strong>Nessun compito trovato</strong>
                    <small>
                      {filtroStato === "tutti" 
                        ? "Non ci sono compiti da visualizzare" 
                        : `Non ci sono compiti con stato "${filtroStato}"`}
                    </small>
                  </div>
                </td>
              </tr>
            ) : (
              compiti.map(
                (c) => (
                  <tr key={c.id}>
                    <td style={{ width: "40%" }}>
                      <strong>
                        {c.traccia.length > 60
                          ? c.traccia.slice(0, 60) + "..."
                          : c.traccia}
                      </strong>
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {c.gruppo.map((utente, j) => (
                          <span
                            key={`${c.id}-${utente.id || j}`}
                            className="badge bg-light text-secondary border"
                          >
                            {utente.cognome} {utente.nome[0]}.
                          </span>
                        ))}
                      </div>
                      <small className="text-muted">
                        {c.numero_studenti} studenti
                      </small>
                    </td>
                    <td>{c.creato_il}</td>
                    <td>
                      <span
                        className={`badge px-3 py-1 rounded-pill ${
                          c.stato === "aperto"
                            ? "bg-success-subtle text-success"
                            : "bg-danger-subtle text-danger"
                        }`}
                      >
                        {c.stato === "aperto" ? "🟢 Aperto" : "🔴 Chiuso"}
                      </span>
                    </td>
                    <td
                      style={{
                        position: "relative",
                        textAlign: "right",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <div className="d-inline-flex align-items-center gap-2 justify-content-end">
                        {c.risposta && c.stato !== "chiuso" && (
                          <button
                            className="btn btn-outline-success btn-sm"
                            title="Valuta"
                            onClick={() => onOpenValutazione(c)}
                          >
                            📊 Valuta
                          </button>
                        )}

                        <button
                          className="btn btn-outline-primary btn-sm"
                          title="Visualizza"
                          onClick={() => onOpenDettaglio(c.id)}
                        >
                          👁️ Visualizza
                        </button>

                        <span
                          role="button"
                          className="menu-kebab-trigger"
                          title="Altro"
                          style={{
                            cursor: "pointer",
                            fontSize: "20px",
                            padding: "0 6px",
                          }}
                          onClick={() =>
                            setMenuApertoId(menuApertoId === c.id ? null : c.id)
                          }
                        >
                          ⋮
                        </span>

                        {menuApertoId === c.id && (
                          <div className="menu-kebab-wrapper">
                            <div
                              className="menu-kebab"
                              onClick={() => {
                                onAssegnaAltroGruppo(c);
                                setMenuApertoId(null);
                              }}
                            >
                              ᯓ➤ Assegna ad un altro gruppo
                              <div className="menu-kebab-arrow" />
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ListaCompiti;