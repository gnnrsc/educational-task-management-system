import { Button, Alert, Form } from "react-bootstrap";
import CaricamentoSpinner from "../utils/LoadingSpinner";

function StepSelezioneStudenti({
  visibile, direzioneSlide, domanda,
  studenti, studentiSelezionati, collaborazioni,
  caricamentoStudenti, invioInCorso, errore,
  selezioneMinima, selezioneMassima, gruppoValido,
  onToggleStudente, onResetSelezione
}) {
  if (!visibile) return null;

  const chiaveCoppia = (id1, id2) => (id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`);

  //ottengo gli ID degli studenti selezionati
  const studentiSelezionatiIds = studentiSelezionati.map(s => s.id);

  //in base ai studenti selezionati, evidenzia quelli che hanno collaborato 2 volte con uno di essi
  const studentiEvidenziati = new Set();
  studentiSelezionatiIds.forEach((idSelezionato) => {
    studenti.forEach((studente) => {
      if (studente.id !== idSelezionato) {
        const chiave = chiaveCoppia(idSelezionato, studente.id);
        if (collaborazioni[chiave]) {
          studentiEvidenziati.add(studente.id);
        }
      }
    });
  });

  return (
    <div className={`modal-step ${direzioneSlide} ${!visibile ? 'step-hidden' : ''}`}>
      <Form>
        {/* Riepilogo della domanda */}
        <div className="bg-light rounded p-2 mb-3">
          <small className="text-muted d-block mb-1"><strong>📝 Traccia:</strong></small>
          <small style={{ fontSize: '0.8rem' }}>
              {domanda.length > 80 ? `${domanda.substring(0, 80)}...` : domanda}
          </small>
        </div>

        {/* Avviso per gli studenti evidenziati - limite collaborazioni */}
        <div className="warning-alert-placeholder">
          {studentiEvidenziati.size > 0 ? (
              <div className="alert alert-warning py-1 mb-0 w-100">
              <small style={{ fontSize: '0.75rem' }}>
                  <strong>⚠️</strong> Gli studenti evidenziati in rosso
                  hanno già partecipato ad almeno 2 compiti precedenti con
                  uno degli studenti selezionati e non possono essere
                  aggiunti al gruppo.
              </small>
              </div>
          ) : (
              <div></div>
          )}
        </div>
        
        <Form.Group className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="fw-bold mb-0">👥 Seleziona gli studenti per il gruppo</h6>
            <Button
              size="sm"
              variant="outline-secondary"
              disabled={invioInCorso || studentiSelezionatiIds.length === 0}
              onClick={onResetSelezione}
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
            >
              🔄 Reset
            </Button>
          </div>
          
          <ContatoreSelezionati
            numeroSelezionati={studentiSelezionatiIds.length}
            selezioneMassima={selezioneMassima}
            selezioneMinima={selezioneMinima}
            gruppoValido={gruppoValido}
          />

          <GrigliaStudenti
            studenti={studenti}
            studentiSelezionatiIds={studentiSelezionatiIds}
            studentiEvidenziati={studentiEvidenziati}
            caricamentoStudenti={caricamentoStudenti}
            invioInCorso={invioInCorso}
            onToggleStudente={onToggleStudente}
          />
        </Form.Group>

        <RiepilogoStudentiSelezionati
          studentiSelezionati={studentiSelezionati}
        />

        {errore && (
          <Alert variant="danger" className="py-2 mt-2">
            <small>{errore}</small>
          </Alert>
        )}
      </Form>
    </div>
  );
}

function ContatoreSelezionati({
  numeroSelezionati, selezioneMassima, selezioneMinima, gruppoValido
}) {
  return (
    <div className="mb-3">
      <small className="text-muted">
        Selezionati: <strong className={gruppoValido ? 'text-success' : 'text-warning'}>
          {numeroSelezionati}
        </strong>/{selezioneMassima}
        <span className={`ms-2 ${gruppoValido ? 'text-success' : 'text-warning'}`}>
          {gruppoValido ? "✅ Gruppo valido" : `⚠️ Minimo ${selezioneMinima} studenti`}
        </span>
      </small>
    </div>
  );
}

function GrigliaStudenti({
  studenti, studentiSelezionatiIds, studentiEvidenziati,
  caricamentoStudenti, invioInCorso, onToggleStudente
}) {
  if (caricamentoStudenti) {
    return (
      <div className="text-center py-3">
        <CaricamentoSpinner variant="inline" />
      </div>
    );
  }

  return (
    <div className="student-grid">
      {studenti.map((studente) => {
        const evidenziato = studentiEvidenziati.has(studente.id) && 
                           !studentiSelezionatiIds.includes(studente.id);
        const selezionato = studentiSelezionatiIds.includes(studente.id);

        return (
          <PulsanteStudente
            key={studente.id}
            studente={studente}
            selezionato={selezionato}
            evidenziato={evidenziato}
            invioInCorso={invioInCorso}
            onToggle={() => onToggleStudente(studente.id)}
          />
        );
      })}
    </div>
  );
}

function PulsanteStudente({ studente, selezionato, evidenziato, invioInCorso, onToggle }) {
  const getTitolo = () => {
    //if (evidenziato) return "Non può essere selezionato - ha già collaborato troppo con uno studente selezionato";
    if (selezionato) return "Clicca per rimuovere dal gruppo";
    return "Clicca per aggiungere al gruppo";
  };

  const getVariante = () => {
    if (selezionato) return "primary";
    if (evidenziato) return "danger";
    return "outline-secondary";
  };

  //visualizza il nome completo dello studente
  const nomeCompleto = `${studente.nome} ${studente.cognome}`;

  return (
    <Button
      size="sm"
      variant={getVariante()}
      className={`text-start ${evidenziato ? 'disabled' : ''}`}
      onClick={onToggle}
      disabled={evidenziato || invioInCorso}
      title={getTitolo()}
      style={{ 
        fontSize: '0.8rem',
        padding: '0.4rem 0.6rem',
        opacity: evidenziato ? 0.6 : 1
      }}
    >
      {selezionato ? "✓ " : ""}{nomeCompleto}
    </Button>
  );
}

function RiepilogoStudentiSelezionati({ studentiSelezionati }) {
  if (studentiSelezionati.length === 0) {
    return (
      <div className="mt-2 p-1 bg-light rounded text-center">
        <small className="text-muted" style={{ fontSize: '0.75rem' }}>
          <strong>👥</strong> Nessuno studente selezionato
        </small>
      </div>
    );
  }

  const nomiSelezionati = studentiSelezionati.map(studente => 
    `${studente.nome} ${studente.cognome}`
  ).join(", ");

  return (
    <div className="mt-2 p-1 bg-primary bg-opacity-10 rounded">
      <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
        <strong>👥 Gruppo selezionato:</strong> {nomiSelezionati}
      </small>
    </div>
  );
}

export default StepSelezioneStudenti;