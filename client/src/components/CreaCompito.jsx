import { useState, useEffect } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import LoadingSpinner from "./utils/LoadingSpinner";
import API from "../API";

function CreaCompito({ onCompitoCreato, onCancel, initialData = null }) {
  const [currentStep, setCurrentStep] = useState(initialData ? 2 : 1);
  const [question, setQuestion] = useState(initialData ? initialData.traccia : "");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [students, setStudents] = useState([]);
  const [collaborations, setCollaborations] = useState([]);
  const [error, setError] = useState("");
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [slideDirection, setSlideDirection] = useState("");

  const MIN_SELECTION = 2;
  const MAX_SELECTION = 6;

  useEffect(() => {
    const getAllStudents = async () => {
      const response = await API.getStudenti();
      const studentiMappati = response.map((utente) => ({
        id: utente.id,
        name: `${utente.nome} ${utente.cognome}`,
      }));
      setStudents(studentiMappati);
    };
    const getCollaborations = async () => {
      const response = await API.getCollaborazioniClasse();
      const collaborationsMappate = response.collaborazioni;
      setCollaborations(collaborationsMappate);
    };
    getAllStudents();
    getCollaborations();
    
    setLoadingStudents(false);
  }, []);

  const pairKey = (id1, id2) => (id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`);

  const highlightedStudents = new Set();
  selectedStudents.forEach((selId) => {
    students.forEach((s) => {
      if (s.id !== selId) {
        const key = pairKey(selId, s.id);
        if (collaborations[key]) {
          // basta che esista la coppia - Poiché collaborations contiene solo coppie con almeno 2 collaborazioni
          highlightedStudents.add(s.id);
        }
      }
    });
  });

  const isGroupValid =
    selectedStudents.length >= MIN_SELECTION &&
    selectedStudents.length <= MAX_SELECTION;

  const handleNext = () => {
    setError("");
    if (!question.trim()) {
      setError("La domanda non può essere vuota.");
      return;
    }
    setSlideDirection("slide-left");
    setTimeout(() => {
      setCurrentStep(2);
      setSlideDirection("");
    }, 150);
  };

  const handleBack = () => {
    setError("");
    setSlideDirection("slide-right");
    setTimeout(() => {
      setCurrentStep(1);
      setSlideDirection("");
    }, 150);
  };

  const handleSubmit = async () => {
    setError("");

    if (!isGroupValid) {
      setError(
        `Il gruppo deve avere almeno ${MIN_SELECTION} studenti e al massimo ${MAX_SELECTION}.`
      );
      return;
    }

    setSubmitting(true);
    
    try {
      // Chiamata API reale - ASPETTA la risposta del server
      const result = await API.createCompito(question.trim(), selectedStudents);
      
      // SOLO quando il server risponde con successo, chiama il callback
      if (result && result.id) {
        // Successo confermato dal server
        onCompitoCreato({ 
          id: result.id,
          participants: selectedStudents,
          traccia: question.trim(),
          studentIds: selectedStudents
        });
        
        // Reset form solo dopo successo confermato
        setQuestion("");
        setSelectedStudents([]);
        setCurrentStep(1);
      } else {
        // Il server ha risposto ma senza ID valido
        throw new Error("Risposta del server non valida");
      }
      
    } catch (error) {
      console.error("Errore nella creazione del compito:", error);
      
      // Gestione errori più specifica
      if (error.message) {
        setError(`Errore: ${error.message}`);
      } else if (error.error) {
        setError(`Errore: ${error.error}`);
      } else {
        setError("Errore nella creazione del compito. Riprova.");
      }
      
      // Il modal rimane aperto in caso di errore
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStudent = (id) => {
    setError("");
    setSelectedStudents((prev) => {
      const alreadySelected = prev.includes(id);
      if (alreadySelected) {
        return prev.filter((sid) => sid !== id);
      } else {
        if (prev.length >= MAX_SELECTION) {
          setError(
            `Hai raggiunto il limite massimo di ${MAX_SELECTION} studenti.`
          );
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  const getStepTitle = () => {
    if (currentStep === 1) return "📝 Domanda del Compito";
    return "👥 Seleziona Studenti";
  };

  const getProgress = () => {
    return `${currentStep}/2`;
  };

  return (
    <div className="p-4">
      {/* Header con titolo e progress */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0 fw-bold">{getStepTitle()}</h6>
        <small className="text-muted">Step {getProgress()}</small>
      </div>

      {/* Progress indicator */}
      <div className="progress-indicator">
        <div className={`progress-dot ${currentStep >= 1 ? 'active' : ''}`}></div>
        <div className={`progress-line ${currentStep >= 2 ? 'active' : ''}`}></div>
        <div className={`progress-dot ${currentStep >= 2 ? 'active' : ''}`}></div>
      </div>

      {/* Container per gli step con animazione */}
      <div className="modal-slide-container">
        
        {/* STEP 1: Domanda del compito */}
        <div className={`modal-step ${slideDirection} ${currentStep !== 1 ? 'step-hidden' : ''}`}>
          <Form>
            <Form.Group className="mb-4" controlId="taskQuestion">
              <Form.Label className="fw-bold mb-3">📝 Inserisci la traccia del compito</Form.Label>
              <Form.Control
                as="textarea"
                rows={8}
                placeholder="Scrivi qui il testo del compito che vuoi assegnare agli studenti...
                
Ad esempio:
- Analizza il tema dell'amicizia nel romanzo studiato
- Risolvi il seguente problema di matematica
- Descrivi le cause della Prima Guerra Mondiale"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={submitting}
                style={{ 
                  fontSize: '0.95rem',
                  lineHeight: '1.5'
                }}
              />
            </Form.Group>

            {/* Info box */}
            <div className="bg-light rounded p-3 mb-4">
              <small className="text-muted">
                <strong>💡 Suggerimento:</strong> Scrivi una domanda chiara e specifica. 
                Gli studenti lavoreranno insieme per rispondere, quindi assicurati che 
                il compito sia adatto al lavoro di gruppo.
              </small>
            </div>

            {/* Character counter */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <small className="text-muted">
                Caratteri: {question.length}
              </small>
              {question.length > 500 && (
                <small className="text-warning">
                  ⚠️ Testo molto lungo
                </small>
              )}
            </div>

            {error && (
              <Alert variant="danger" className="py-2 mb-3">
                <small>{error}</small>
              </Alert>
            )}
          </Form>
        </div>

        {/* STEP 2: Selezione studenti */}
        <div className={`modal-step ${slideDirection} ${currentStep !== 2 ? 'step-hidden' : ''}`}>
          
          {/* Riepilogo domanda - più compatto */}
          <div className="bg-light rounded p-2 mb-3">
            <small className="text-muted d-block mb-1"><strong>📝 Traccia:</strong></small>
            <small style={{ fontSize: '0.8rem' }}>
              {question.length > 80 ? `${question.substring(0, 80)}...` : question}
            </small>
          </div>

          {/* Placeholder sempre presente per avviso studenti evidenziati */}
          <div className="warning-alert-placeholder">
            {highlightedStudents.size > 0 ? (
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

          {/* Contatore e reset - più compatto */}
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div>
              <small className="text-muted">
                Selezionati: <strong className={isGroupValid ? 'text-success' : 'text-warning'}>
                  {selectedStudents.length}
                </strong>/{MAX_SELECTION}
                <span className={`ms-2 ${isGroupValid ? 'text-success' : 'text-warning'}`}>
                  {isGroupValid ? "✅" : `⚠️ Min ${MIN_SELECTION}`}
                </span>
              </small>
            </div>
            <Button
              size="sm"
              variant="outline-secondary"
              disabled={submitting || selectedStudents.length === 0}
              onClick={() => {
                setSelectedStudents([]);
                setError("");
              }}
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
            >
              🔄 Reset
            </Button>
          </div>

          {/* Griglia studenti - più compatta */}
          {loadingStudents ? (
            <div className="text-center py-3">
              <LoadingSpinner variant="inline" />
            </div>
          ) : (
            <div className="student-grid">
              {students.map((student) => {
                const isHighlighted =
                  highlightedStudents.has(student.id) &&
                  !selectedStudents.includes(student.id);
                const isSelected = selectedStudents.includes(student.id);

                return (
                  <Button
                    key={student.id}
                    size="sm"
                    variant={isSelected ? "primary" : isHighlighted ? "danger" : "outline-secondary"}
                    className={`text-start ${isHighlighted ? 'disabled' : ''}`}
                    onClick={() => toggleStudent(student.id)}
                    disabled={isHighlighted || submitting}
                    title={
                      isHighlighted
                        ? "Ha già collaborato troppo con uno selezionato"
                        : isSelected
                        ? "Clicca per rimuovere"
                        : "Clicca per aggiungere"
                    }
                    style={{ 
                      fontSize: '0.8rem',
                      padding: '0.4rem 0.6rem',
                      opacity: isHighlighted ? 0.6 : 1
                    }}
                  >
                    {isSelected ? "✓ " : ""}{student.name}
                  </Button>
                );
              })}
            </div>
          )}

          {/* Studenti selezionati summary - più compatto */}
          {selectedStudents.length > 0 && (
            <div className="mt-2 p-1 bg-primary bg-opacity-10 rounded">
              <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                <strong>👥</strong> {selectedStudents.map(id => 
                  students.find(s => s.id === id)?.name
                ).join(", ")}
              </small>
            </div>
          )}

          {error && (
            <Alert variant="danger" className="py-2 mt-2">
              <small>{error}</small>
            </Alert>
          )}
        </div>
      </div>

      {/* Footer con pulsanti */}
      <div className="d-flex justify-content-between mt-4">
        <div>
          {currentStep === 2 && (
            <Button
              variant="outline-secondary"
              onClick={handleBack}
              disabled={submitting}
              style={{ fontSize: '0.9rem' }}
            >
              ← Indietro
            </Button>
          )}
        </div>
        
        <div className="d-flex gap-2">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={submitting}
            style={{ fontSize: '0.9rem' }}
          >
            ❌ Annulla
          </Button>
          
          {currentStep === 1 ? (
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={!question.trim() || submitting}
              style={{ fontSize: '0.9rem' }}
            >
              Avanti → 
            </Button>
          ) : (
            <Button
              variant="success"
              onClick={handleSubmit}
              disabled={submitting || !isGroupValid}
              style={{ fontSize: '0.9rem' }}
            >
              {submitting ? (
                <LoadingSpinner variant="inline" />
              ) : (
                <>📝 Crea Compito</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreaCompito;