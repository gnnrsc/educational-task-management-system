import { useEffect } from "react";
import { Container, Button } from "react-bootstrap";
import { useNavigate } from "react-router";
import { useAuth } from "../../AuthContext.jsx"; 

function HomePage() {
  const { loggedIn, user } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (loggedIn) {
      if (user?.ruolo === "docente") {
        navigate("/docente/compiti");
      } else {
        navigate("/studente/compiti");
      }
    } else {
      navigate("/login");
    }
  };

  // Altrimenti renderizzo la homepage classica
  return (
    <Container
      className="text-center my-4"
      style={{ maxWidth: "800px", paddingTop: "120px" }}
    >
      <h1 className="mb-5">
        <strong>Compiti di gruppo senza il solito incubo!</strong>
      </h1>
      <p className="mb-4 fs-5" style={{ maxWidth: "650px", margin: "0 auto" }}>
        Studenti più sereni, docenti più organizzati. Assegna, valuta, migliora.
        Tutto con pochi clic 🖱️✨
      </p>

      <Button variant="primary" size="lg" onClick={handleGetStarted}>
        {loggedIn ? "Vai ai compiti" : "Inizia ora"}
      </Button>
    </Container>
  );
}

export default HomePage;
