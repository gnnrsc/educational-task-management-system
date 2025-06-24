import { Navigate } from "react-router";
import { useAuth } from "../../AuthContext.jsx";

function ProtectedRoute({ children, ruoliConcessi }) {
  const { loggedIn, user } = useAuth();

  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (ruoliConcessi && !ruoliConcessi.includes(user?.ruolo)) {
    return (
      <div className="text-center mt-5">
        <h1>403 - Accesso negato</h1>
        <p>Non hai i permessi per accedere a questa pagina.</p>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;