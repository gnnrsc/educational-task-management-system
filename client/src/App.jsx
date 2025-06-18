import { useState, useEffect } from "react";
import { Routes, Route, Link } from "react-router";
import TaskForm from "./components/TaskForm";
import {
  Container,
  Navbar,
  Nav,
  Card,
  Alert,
  Button,
  Spinner,
} from "react-bootstrap";
import dayjs from "dayjs";
import "./App.css";

// Test component per verificare tutte le dipendenze
function DependencyTest() {
  const [serverData, setServerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/test", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setServerData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Errore:", err);
        setError("Errore connessione al server");
        setLoading(false);
      });
  }, []);

  return (
    <Card>
      <Card.Header>
        <h5>🧪 Test Dipendenze</h5>
      </Card.Header>
      <Card.Body>
        <div className="mb-3">
          <strong>Day.js Test:</strong>
          <p>Data corrente: {dayjs().format("DD/MM/YYYY HH:mm:ss")}</p>
        </div>

        <div className="mb-3">
          <strong>Server Connection:</strong>
          {loading && (
            <div className="d-flex align-items-center">
              <Spinner animation="border" size="sm" className="me-2" />
              Connecting...
            </div>
          )}
          {error && <Alert variant="danger">{error}</Alert>}
          {serverData && (
            <Alert variant="success">
              <div>✅ {serverData.message}</div>
              <small>Session ID: {serverData.session}</small>
              <br />
              <small>
                Timestamp:{" "}
                {dayjs(serverData.timestamp).format("DD/MM/YYYY HH:mm:ss")}
              </small>
            </Alert>
          )}
        </div>

        <div className="mb-3">
          <strong>React Bootstrap Test:</strong>
          <div className="d-flex justify-content-center gap-2 mt-2">
            <Button variant="primary" size="sm">
              <i className="bi bi-check-circle me-1"></i>Primary
            </Button>
            <Button variant="success" size="sm">
              <i className="bi bi-heart-fill me-1"></i>Success
            </Button>
            <Button variant="warning" size="sm">
              <i className="bi bi-exclamation-triangle me-1"></i>Warning
            </Button>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}

// Placeholder components per testare il routing
function Home() {
  return (
    <div>
      <h2>🏠 Home</h2>
      <p>Benvenuto nell'applicazione Compiti!</p>
      <DependencyTest />
    </div>
  );
}

function Login() {
  return (
    <Card>
      <Card.Header>
        <h4>🔐 Login</h4>
      </Card.Header>
      <Card.Body>
        <p>Form di login (da implementare)</p>
        <Button variant="primary">Login Docente</Button>{" "}
        <Button variant="secondary">Login Studente</Button>
      </Card.Body>
    </Card>
  );
}

function TeacherDashboard() {
  const handleTaskSubmit = (data) => {
    console.log("Compito creato:", data);
    // Qui puoi aggiungere chiamata API per salvare il compito
  };

  return (
    <div>
      <h2>👨‍🏫 Dashboard Docente</h2>
      <Alert variant="info">Dashboard docente (da implementare)</Alert>

      {/* Inserisco il form TaskForm */}
      <div style={{ marginTop: "20px" }}>
        <TaskForm onSubmit={handleTaskSubmit} />
      </div>
    </div>
  );
}

function StudentDashboard() {
  return (
    <div>
      <h2>👨‍🎓 Dashboard Studente</h2>
      <Alert variant="info">Dashboard studente (da implementare)</Alert>
    </div>
  );
}

function App() {
  return (
    <div className="App">
      {/* Navigation */}
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container fluid>
          <Navbar.Brand href="#home">
            <i className="bi bi-journal-text me-2"></i>📚 Compiti App
          </Navbar.Brand>
          <Navbar.Toggle />
          <Navbar.Collapse>
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/">
                <i className="bi bi-house me-1"></i>Home
              </Nav.Link>
              <Nav.Link as={Link} to="/login">
                <i className="bi bi-box-arrow-in-right me-1"></i>Login
              </Nav.Link>
              <Nav.Link as={Link} to="/teacher">
                <i className="bi bi-person-badge me-1"></i>Teacher
              </Nav.Link>
              <Nav.Link as={Link} to="/student">
                <i className="bi bi-mortarboard me-1"></i>Student
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Main Content */}
      <Container fluid className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/student" element={<StudentDashboard />} />
          <Route
            path="*"
            element={
              <Alert variant="warning">
                <h4>404 - Pagina non trovata</h4>
                <p>La pagina richiesta non esiste.</p>
                <Button as={Link} to="/" variant="primary">
                  Torna alla Home
                </Button>
              </Alert>
            }
          />
        </Routes>
      </Container>
    </div>
  );
}


export default App;
