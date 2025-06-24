import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router";

// import * as pages from "./components/pages";
import HomePage from "./components/pages/Homepage";
import LoginForm from "./components/pages/Login";
import DefaultLayout from "./components/pages/DefaultLayout";
// import * as utils from "./components/utils";
import LoadingSpinner from "./components/utils/LoadingSpinner";
import ProtectedRoute from "./components/utils/ProtectedRoute";
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
        //console.error("Utente non loggato o errore nel recupero delle informazioni:", err);
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

  if (loading) { // Mostra un loader mentre si verifica se l'utente è loggato
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      <Route element={<DefaultLayout loggedIn={loggedIn} handleLogout={handleLogout} user={user} />}>
        <Route path="/" element={<HomePage loggedIn={loggedIn} ruolo={user?.ruolo} />} />
        <Route path="/login" element={ loggedIn ? (
          user?.ruolo === 'docente' ? (
            <Navigate to="/docente/compiti" replace />
          ) : (
            <Navigate to="/studente/compiti" replace />
          )
        ) : ( <LoginForm handleLogin={handleLogin} /> ) } />
        <Route path="docente/compiti" element={ <ProtectedRoute loggedIn={loggedIn} ruoloUtente={user?.ruolo} ruoliConcessi={['docente']}><div>Compiti Page docente (da implementare)</div></ProtectedRoute> } />
        <Route path="studente/compiti" element={ <ProtectedRoute loggedIn={loggedIn} ruoloUtente={user?.ruolo} ruoliConcessi={['studente']}><div>Compiti Page studente (da implementare)</div></ProtectedRoute> } />
        <Route path="*" element={ <div className="text-center mt-5"> <h1>404 - Pagina non trovata</h1> <p>La pagina che stai cercando non esiste.</p> </div> } />
      </Route>
    </Routes>
  );
}

export default App;
