import { useState, useEffect } from "react";
import { Card, Form, Button, Alert, Spinner, Container } from "react-bootstrap";
import API from "../API";

function TaskForm({ onSubmit }) {
  const [question, setQuestion] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [students, setStudents] = useState([]);
  const [collaborations, setCollaborations] = useState([]);
  const [error, setError] = useState("");
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!question.trim()) {
      setError("La domanda non può essere vuota.");
      return;
    }
    if (!isGroupValid) {
      setError(
        `Il gruppo deve avere almeno ${MIN_SELECTION} studenti e al massimo ${MAX_SELECTION}.`
      );
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      onSubmit({ question, participants: selectedStudents });
      setQuestion("");
      setSelectedStudents([]);
      setSubmitting(false);
    }, 1000);
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

  return (
    <Container className="d-flex justify-content-center align-items-start mt-5">
      <div style={{ maxWidth: "1100px", width: "100%" }}>
        <Card className="shadow">
          <Card.Header>
            <h5>📝 Crea nuovo compito</h5>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="taskQuestion">
                <Form.Label>Domanda del compito</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Inserisci il testo del compito..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={submitting}
                />
              </Form.Group>
              <div style={{ minHeight: "1.5rem" }} className="mb-2">
                {highlightedStudents.size > 0 && (
                  <div
                    className="text-warning mb-2"
                    style={{ fontSize: "0.775rem" }}
                  >
                    <div>
                      <strong>Attenzione:</strong> gli studenti evidenziati
                      hanno già partecipato ad almeno 2 compiti precedenti con
                      uno degli studenti selezionati e non possono essere
                      aggiunti al gruppo.
                    </div>
                  </div>
                )}
              </div>

              <Form.Group className="mb-3">
                <fieldset>
                  <legend className="fw-bold text-center d-block mb-2">
                    Seleziona studenti partecipanti
                  </legend>

                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      Studenti selezionati: {selectedStudents.length} /{" "}
                      {MAX_SELECTION}
                    </div>
                    <Button
                      size="sm"
                      className="reset-button"
                      disabled={submitting || selectedStudents.length === 0}
                      onClick={() => {
                        setSelectedStudents([]);
                        setError("");
                      }}
                    >
                      Reset selezioni
                    </Button>
                  </div>

                  {loadingStudents ? (
                    <div>
                      <Spinner animation="border" size="sm" /> Caricamento
                      studenti...
                    </div>
                  ) : (
                    <div className="student-grid">
                      {students.map((student) => {
                        const isHighlighted =
                          highlightedStudents.has(student.id) &&
                          !selectedStudents.includes(student.id);
                        const isSelected = selectedStudents.includes(
                          student.id
                        );

                        return (
                          <Button
                            key={student.id}
                            className={`btn-student ${
                              isSelected ? "selected" : ""
                            } ${isHighlighted ? "highlighted" : ""}`}
                            onClick={() => toggleStudent(student.id)}
                            disabled={isHighlighted || submitting}
                            title={
                              isHighlighted
                                ? "Questo studente ha già collaborato con uno selezionato."
                                : ""
                            }
                          >
                            {student.name}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </fieldset>
              </Form.Group>

              {error && (
                <Alert
                  variant="danger"
                  style={{
                    padding: "0.25rem 0.75rem",
                    fontSize: "0.85rem",
                    marginBottom: "1rem",
                  }}
                >
                  {error}
                </Alert>
              )}
              <Button
                variant="primary"
                type="submit"
                disabled={submitting || !isGroupValid}
              >
                {submitting ? "Salvataggio..." : "Crea Compito"}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
}

export default TaskForm;
