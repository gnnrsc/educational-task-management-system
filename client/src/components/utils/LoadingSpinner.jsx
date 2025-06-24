import { Spinner } from "react-bootstrap";

function LoadingSpinner({ variant = "full" }) {
  if (variant === "inline") {
    // Spinner piccolo + testo, da usare dentro bottoni o inline
    return (
      <>
        <Spinner
          as="span"
          animation="border"
          size="sm"
          role="status"
          aria-hidden="true"
          className="me-2"
        />
        Caricamento...
      </>
    );
  }

  // Default: spinner grande fullscreen
  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ height: "50vh" }}
    >
      <Spinner animation="border" role="status" />
      <span className="visually-hidden">Loading...</span>
    </div>
  );
}

export default LoadingSpinner;
