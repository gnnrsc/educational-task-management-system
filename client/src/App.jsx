import { Routes, Route, Navigate } from "react-router";
import HomePage from "./components/pages/Homepage";
import LoginForm from "./components/pages/Login";
import DefaultLayout from "./components/pages/DefaultLayout";
import DocenteDashboard from "./components/pages/docente/DocenteDashboard.jsx";
import DettaglioCompitoDocente from "./components/pages/docente/DettaglioCompitoDocente.jsx";
import ValutazioneCompito from "./components/pages/docente/ValutazioneCompito.jsx";
import StatoClasse from "./components/pages/docente/StatoClasse.jsx";
import StudenteDashboard from "./components/pages/studente/StudenteDashboard.jsx";
import DettaglioCompitoStudente from "./components/pages/studente/DettaglioCompitoStudente.jsx";
import Valutazioni from "./components/pages/studente/Valutazioni.jsx";
import RispostaCompito from "./components/pages/studente/RispostaCompito.jsx";

import LoadingSpinner from "./components/utils/LoadingSpinner";
import ProtectedRoute from "./components/utils/ProtectedRoute";

import { useAuth } from "./AuthContext.jsx";


function App() {
  //Uso il contesto di autenticazione per ottenere lo stato di login, l'utente e le funzioni di login/logout
  const { loggedIn, user, loading } = useAuth();

  if (loading) { // Mostra un loader mentre si verifica se l'utente è loggato
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      <Route element={<DefaultLayout/>}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={ loggedIn ? (
          user?.ruolo === 'docente' ? (
            <Navigate to="/docente/compiti" replace />
          ) : (
            <Navigate to="/studente/compiti" replace />
          )
        ) : ( <LoginForm /> ) } />
        <Route path="/docente/compiti" element={ <ProtectedRoute ruoliConcessi={['docente']}><DocenteDashboard /></ProtectedRoute> } />
        <Route path="/docente/compiti/:id" element={<ProtectedRoute ruoliConcessi={['docente']}><DettaglioCompitoDocente /></ProtectedRoute>} />
        <Route path="/docente/compiti/:id/valuta" element={<ProtectedRoute ruoliConcessi={['docente']}><ValutazioneCompito /></ProtectedRoute>} />
        <Route path="/docente/classe" element={ <ProtectedRoute ruoliConcessi={['docente']}><StatoClasse /></ProtectedRoute> } />
        <Route path="/studente/compiti" element={ <ProtectedRoute ruoliConcessi={['studente']}><StudenteDashboard /></ProtectedRoute> } />
        <Route path="/studente/compiti/:id" element={<ProtectedRoute ruoliConcessi={['studente']}><DettaglioCompitoStudente /></ProtectedRoute>} />
        <Route path="/studente/compiti/:id/rispondi" element={<ProtectedRoute ruoliConcessi={['studente']}><RispostaCompito /></ProtectedRoute>} />
        <Route path="/studente/valutazioni" element={ <ProtectedRoute ruoliConcessi={['studente']}><Valutazioni /></ProtectedRoute> } />
        <Route path="*" element={ <div className="text-center mt-5"> <h1>404 - Pagina non trovata</h1> <p>La pagina che stai cercando non esiste.</p> </div> } />
      </Route>
    </Routes>
  );
}

export default App;