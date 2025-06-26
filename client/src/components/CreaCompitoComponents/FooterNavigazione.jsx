import { Button } from "react-bootstrap";
import CaricamentoSpinner from "../utils/LoadingSpinner";

function FooterNavigazione({
  stepCorrente, domanda, invioInCorso,
  gruppoValido, onIndietro, onAvanti,
  onInvio, onAnnulla
}) {
  return (
    <div className="d-flex justify-content-between mt-4">
      <div>
        {stepCorrente === 2 && (
          <Button
            variant="outline-secondary"
            onClick={onIndietro}
            disabled={invioInCorso}
            style={{ fontSize: '0.9rem' }}
          >
            ← Indietro
          </Button>
        )}
      </div>
      
      <div className="d-flex gap-2">
        <Button
          variant="secondary"
          onClick={onAnnulla}
          disabled={invioInCorso}
          style={{ fontSize: '0.9rem' }}
        >
          ❌ Annulla
        </Button>
        
        {stepCorrente === 1 ? (
          <Button
            variant="primary"
            onClick={onAvanti}
            disabled={!domanda.trim() || invioInCorso}
            style={{ fontSize: '0.9rem' }}
          >
            Avanti → 
          </Button>
        ) : (
          <Button
            variant="success"
            onClick={onInvio}
            disabled={invioInCorso || !gruppoValido}
            style={{ fontSize: '0.9rem' }}
          >
            {invioInCorso ? (
              <CaricamentoSpinner variant="inline" />
            ) : (
              <>📝 Crea Compito</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

export default FooterNavigazione;