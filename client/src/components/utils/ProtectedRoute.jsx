import { Navigate } from "react-router";

function ProtectedRoute({ loggedIn, ruoloUtente, ruoliConcessi = [], children }) {
  if (!loggedIn) {
    // Se non loggato, reindirizza al login
    return <Navigate to="/login" replace />;
  }

  if (ruoliConcessi.length > 0 && !ruoliConcessi.includes(ruoloUtente)) {
    // Se il ruolo non è tra quelli permessi, mostra errore o redirect
    return (
      <div className="text-center mt-5">
        <h1>Accesso Negato</h1>
        <p>Non hai i permessi necessari per visualizzare questa pagina.</p>
      </div>
    );
    // oppure fai redirect a una pagina di default:
    // return <Navigate to="/" replace />;
  }

  // Se tutto ok, mostra il contenuto protetto
  return children;
}

export default ProtectedRoute;
