import { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";

function ListaCompiti({
  compiti, 
  onApriDettaglio, 
  onApriValutazione, // per docente
  onAssegnaAltroGruppo, // per docente
  onApriRisposta // per studenti
}) {

  const { user } = useAuth();

  const [filtroStato, setFiltroStato] = useState("tutti");
  
  // Stato per gestire il menu a tendina per copiare il compito
  const [menuApertoId, setMenuApertoId] = useState(null);

  // filtra i compiti in base al filtro selezionato
  const compitiFiltrati = filtroStato === "tutti" 
    ? compiti 
    : compiti.filter(compito => compito.stato === filtroStato);

  useEffect(() => {
    const handleClickFuori = (e) => {
      if (!e.target.closest(".menu-kebab-trigger")) {
        setMenuApertoId(null);
      }
    };
    document.addEventListener("click", handleClickFuori);
    return () => document.removeEventListener("click", handleClickFuori);
  }, []);

  const handleCambioFiltro = (nuovoFiltro) => {
    setFiltroStato(nuovoFiltro);
  };

  // Renderizzazione azioni di default per studente
  const renderAzioniStudente = (c) => (
    <div className="d-inline-flex align-items-center gap-2">
      {c.stato === "aperto" && (
        <button
          className={`btn btn-sm ${
            c.risposta 
              ? "btn-outline-warning"
              : "btn-outline-success"
          }`}
          title={c.risposta ? "Modifica risposta" : "Inserisci risposta"}
          onClick={() => onApriRisposta(c)}
        >
          {c.risposta ? "✏️ Modifica" : "📝 Rispondi"}
        </button>
      )}

      <button
        className="btn btn-outline-primary btn-sm"
        title="Visualizza dettagli"
        onClick={() => onApriDettaglio(c.id)}
      >
        👁️ Visualizza
      </button>
    </div>
  );

  // Renderizzazione azioni di default per docente
  const renderAzioniDocente = (c) => (
    <div className="d-inline-flex align-items-center gap-2 justify-content-end">
      {c.risposta && c.stato !== "chiuso" && (
        <button
          className="btn btn-outline-success btn-sm"
          title="Valuta"
          onClick={() => onApriValutazione(c)}
        >
          📊 Valuta
        </button>
      )}

      <button
        className="btn btn-outline-primary btn-sm"
        title="Visualizza"
        onClick={() => onApriDettaglio(c.id)}
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
  );

  return (
    <div className="container py-3">
      <div className="d-flex flex-wrap gap-3 mb-4 align-items-center">
        <fieldset className="d-flex align-items-center border-0 p-0 m-0">
          <legend className="fw-semibold me-2 small mb-0">
            Filtra per stato:
          </legend>
          {["aperto", "chiuso", "tutti"].map((f) => (
            <button
              key={f}
              onClick={() => handleCambioFiltro(f)}
              className={`btn btn-sm me-1 ${
                filtroStato === f
                  ? "btn-outline-primary active"
                  : "btn-outline-secondary"
              }`}
            >
              {f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </fieldset>

        <div className="ms-auto">
          <small className="text-muted">
            {compitiFiltrati.length} di {compiti.length} compiti
          </small>
        </div>
      </div>

      <div
        className="table-responsive"
        style={{
          maxHeight: "410px",
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
              <th style={{ width: "40%" }}>Traccia</th>
              <th>Gruppo</th>
              <th>Data</th>
              <th>Stato</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {compitiFiltrati.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4 text-muted">
                  <div className="d-flex flex-column align-items-center">
                    <span style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                      📝
                    </span>
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
              compitiFiltrati.map((c) => (
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
                    {user?.ruolo === "studente"
                      ? renderAzioniStudente(c)
                      : renderAzioniDocente(c)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ListaCompiti;