import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router";

import HomePage from "./components/pages/Homepage";
import LoginForm from "./components/pages/Login";
import DefaultLayout from "./components/pages/DefaultLayout";
import LoadingSpinner from "./components/utils/LoadingSpinner";
import API from "./API";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // useEffect per controllare se l'utente è loggato all'avvio
  useEffect(() => {
    API.getUserInfo()
      .then((user) => {
        setUser(user);
        setLoggedIn(true);
      })
      .catch((err) => {
        console.error(
          "Utente non loggato o errore nel recupero delle informazioni:",
          err
        );
        setLoggedIn(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleLogout = async () => {
    try {
      await API.logOut();
      setLoggedIn(false); 
      setUser(null);
    } catch (err) {
      //console.error("Errore durante il logout:", err);
    }
  };

  const handleLogin = async (credentials) => {
  try {
    const user = await API.logIn(credentials);
    setLoggedIn(true);
    setUser(user);
    return { success: true };
  } catch (err) {
    if (err.status === 401) {
      return { success: false, message: "Email o password errati, riprova." };
    } else {
      return { success: false, message: "Errore durante il login. Riprova più tardi." };
    }
  }
};


  // Componente per proteggere le rotte
  // Se l'utente non è loggato, reindirizza alla pagina di login
  const ProtectedRoute = ({ children }) => {
    return loggedIn ? children : <Navigate to="/login" replace />;
  };

  if (loading) { // Mostra un loader mentre si verifica se l'utente è loggato
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      <Route element={<DefaultLayout loggedIn={loggedIn} handleLogout={handleLogout} user={user} />}>
        <Route path="/" element={<HomePage loggedIn={loggedIn} />} />
        <Route path="/login" element={ loggedIn ? ( <Navigate to="/compiti" replace /> ) : ( <LoginForm handleLogin={handleLogin} /> ) } />
        <Route path="/compiti" element={ <ProtectedRoute loggedIn={loggedIn}> <div>Compiti Page (da implementare)</div> </ProtectedRoute> } />
        <Route path="*" element={ <div className="text-center mt-5"> <h1>404 - Pagina non trovata</h1> <p>La pagina che stai cercando non esiste.</p> </div> } />
      </Route>
    </Routes>
  );
}

export default App;
