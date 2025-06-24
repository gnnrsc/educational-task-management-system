import { useEffect } from 'react';
import { Container, Button } from "react-bootstrap";
import { useNavigate } from "react-router";

function HomePage({ loggedIn }) {
  const navigate = useNavigate();

  // Se loggato, redirect automatico a /compiti
  useEffect(() => {  //gestito come useEffect per evitare loop di rendering
    if (loggedIn) {
      // con replace per evitare che l'utente possa tornare indietro nella cronologia del browser e tornare alla homepage
      navigate('/compiti', { replace: true });
    }
  }, [loggedIn, navigate]);

  const handleGetStarted = () => {
    if (loggedIn) {
      navigate('/compiti');
    } else {
      navigate('/login');
    }
  };

  // Se è loggato, il redirect avviene nel useEffect, quindi non renderizziamo nulla qui
  if (loggedIn) {
    return null; // utile per evitare rendering multipli
  }

  // Altrimenti renderizzo la homepage classica
  return (
    <Container
      className="text-center my-4"
      style={{ maxWidth: "800px", paddingTop: "120px" }}
    >
      <h1 className="mb-5">
        <strong>Compiti di gruppo senza il solito incubo!</strong>
      </h1>
      <p
        className="mb-4 fs-5"
        style={{ maxWidth: "650px", margin: "0 auto" }}
      >
        Studenti più sereni, docenti più organizzati. Assegna, valuta,
        migliora. Tutto con pochi clic 🖱️✨
      </p>
      
      <Button variant="primary" size="lg" onClick={handleGetStarted}>
        Inizia ora
      </Button>
    </Container>
  );
}

export default HomePage;
