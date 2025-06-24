import { createContext, useState, useEffect, useContext } from "react";
import API from "./API";

//Uso il contesto di autenticazione per ottenere lo stato di login, l'utente e le funzioni di login/logout
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.getUserInfo()
      .then((user) => {
        setUser(user);
        setLoggedIn(true);
      })
      .catch(() => {
        setLoggedIn(false);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const logIn = async (credentials) => {
    try {
      const user = await API.logIn(credentials);
      setUser(user);
      setLoggedIn(true);
      return { success: true };
    } catch (err) {
      if (err.status === 401) {
        return { success: false, message: "Email o password errati." };
      } else {
        return { success: false, message: "Errore durante il login." };
      }
    }
  };

  const logOut = async () => {
    await API.logOut();
    setLoggedIn(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ loggedIn, user, loading, logIn, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook per usare il contesto
export function useAuth() {
  return useContext(AuthContext);
}
