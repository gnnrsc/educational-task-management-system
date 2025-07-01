import { useState, useEffect } from "react";

const ErrorAlert = ({ error, onClose, onAction }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
    }
  }, [error]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  if (!error || !isVisible) return null;

  const getAlertConfig = (codice) => {
    const configs = {
      COMPITO_CHIUSO: {
        title: "⚠️ Compito Non Disponibile",
        message: "Il compito è già stato chiuso e non può essere più valutato.",
        type: "warning",
        actions: [
          { text: "Torna Indietro", action: "back", variant: "primary" },
        ],
      },
      COMPITO_CHIUSO_STUDENTE: {
        title: "🔒 Compito Chiuso",
        message:
          "Il compito è già stato chiuso dal docente e non può essere più modificato.",
        type: "warning",
        actions: [
          { text: "Torna al Dettaglio", action: "back", variant: "primary" },
        ],
      },
      LIMITE_COLLABORAZIONI_SUPERATO: {
        title: "👥 Limite Collaborazioni Superato",
        message:
          error.message ||
          "Il gruppo selezionato supera il limite di collaborazioni consentite.",
        type: "warning",
        actions: [
          { text: "Modifica Gruppo", action: "close", variant: "primary" },
          { text: "Annulla", action: "cancel", variant: "secondary" },
        ],
      },
      RISPOSTA_MODIFICATA: {
        title: "🔄 Risposta Modificata",
        message:
          "La risposta è stata modificata durante la valutazione. È necessario ricaricare la pagina per vedere la versione aggiornata.",
        type: "info",
        actions: [
          { text: "Ricarica Pagina", action: "reload", variant: "primary" },
          { text: "Annulla", action: "close", variant: "secondary" },
        ],
      },
      NESSUNA_RISPOSTA: {
        title: "📝 Nessuna Risposta",
        message: "Non è ancora stata inviata una risposta per questo compito.",
        type: "info",
        actions: [
          { text: "Torna Indietro", action: "back", variant: "primary" },
        ],
      },
    };

    return (
      configs[codice] || {
        title: "❌ Errore",
        message: error.message || "Si è verificato un errore imprevisto.",
        type: "error",
        actions: [{ text: "Chiudi", action: "close", variant: "primary" }],
      }
    );
  };

  const config = getAlertConfig(error.codice);

  const handleAction = (action) => {
    switch (action) {
      case "reload":
        window.location.reload();
        break;
      case "back":
        if (onAction) onAction("back");
        break;
      case "close":
      default:
        handleClose();
        break;
    }
  };

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div
          className={`modal-content border-${
            config.type === "warning"
              ? "warning"
              : config.type === "info"
              ? "info"
              : "danger"
          }`}
        >
          <div
            className={`modal-header bg-${
              config.type === "warning"
                ? "warning"
                : config.type === "info"
                ? "info"
                : "danger"
            } text-white`}
          >
            <h5 className="modal-title">{config.title}</h5>
          </div>
          <div className="modal-body">
            <p className="mb-0">{config.message}</p>
          </div>
          <div className="modal-footer">
            {config.actions.map((action, index) => (
              <button
                key={index}
                type="button"
                className={`btn btn-${action.variant}`}
                onClick={() => handleAction(action.action)}
              >
                {action.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorAlert;
