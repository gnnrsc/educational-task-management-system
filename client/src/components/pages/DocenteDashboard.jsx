import { useState, useEffect } from "react";
import { useNavigate } from 'react-router';
import CreaCompito from "../CreaCompito";
import ListaCompiti from "../ListaCompiti";
import ValutazioneCompito from "../ValutazioneCompito"; 
import LoadingSpinner from "../utils/LoadingSpinner";
import API from "../../API";

function DocenteDashboard() {
  const navigate = useNavigate();
  const [mostraCreaCompito, setMostraCreaCompito] = useState(false);
  const [compitoDatiIniziali, setCompitoDatiIniziali] = useState(null);
  const [compiti, setCompiti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [compitoDaValutare, setCompitoDaValutare] = useState(null);
  
  useEffect(() => {
    const caricaCompiti = async () => {
      setLoading(true);
      try {
        const response = await API.ottieniCompitiDocente();
        setCompiti(response.compiti);
      } catch (error) {
        console.error("Errore nel caricamento compiti:", error);
        setCompiti([]);
      }
      setLoading(false);
    };

    caricaCompiti();
  }, []); 

  // FUNZIONI PER LA VALUTAZIONE-------------------
  const handleApriValutazione = (compito) => {
    setCompitoDaValutare(compito);
  };

  const handleSalvaValutazione = async (punteggio) => {
    try {      
      // aggiorna lo stato locale del compito chiudendolo, dopo che ottiene il punteggio dal server
      setCompiti((prev) =>
        prev.map((c) =>
          c.id === compitoDaValutare.id
            ? { ...c, punteggio: punteggio, stato: "chiuso" }
            : c
        )
      );
      
      // chiude il modale
      setCompitoDaValutare(null);
    
    } catch (error) {
      //console.error("Errore nel salvataggio:", error);
    }
  };

  const handleCancellaValutazione = () => {
    setCompitoDaValutare(null);
  };

  // ----------------------------------------------

  //cambia pagina al dettaglio del compito
  const handleApriDettaglio = (compitoId) => {
    navigate(`/docente/compiti/${compitoId}`);
  };

  // gestione della creazione di un nuovo compito
  const handleCompitoCreato = async (nuovoCompito) => {
    try {
      const compitoPerLista = nuovoCompito;

      // aggiungo il nuovo compito in cima alla lista
      setCompiti(prev => [compitoPerLista, ...prev]);
      
      // chiudo il modal solo DOPO aver aggiornato con successo
      setMostraCreaCompito(false);
      setCompitoDatiIniziali(null);

    } catch (error) {
      //console.error("Errore nell'aggiornamento della lista:", error);
      // il modale rimane aperto se c'è un errore nell'aggiornamento
    }
  };

  // funzione per gestire l'assegnazione dello stesso compito ad un altro gruppo
  const handleAssegnaAltroGruppo = (compito) => {
    setCompitoDatiIniziali(compito);
    setMostraCreaCompito(true);
  };

  if (loading) return <LoadingSpinner />;
  
  return (
    <div className="container my-3">
      {/* breadcrumb compatto iniziale */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item active">
            📚 Compiti
          </li>
        </ol>
      </nav>

      <div className="d-flex justify-content-center mb-4">
        <button
          className="btn btn-primary btn-lg"
          onClick={() => setMostraCreaCompito(true)}
        >
          ➕ Crea Nuovo Compito
        </button>
      </div>

      <ListaCompiti 
        compiti={compiti}
        onApriDettaglio={handleApriDettaglio}
        onApriValutazione={handleApriValutazione} 
        onAssegnaAltroGruppo={handleAssegnaAltroGruppo}
      />

      {/* modale per creare nuovo compito */}
      {mostraCreaCompito && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog" style={{ maxWidth: '1400px' }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {compitoDatiIniziali ? "📋 Assegna Compito ad un altro Gruppo" : "➕ Crea Nuovo Compito"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => { 
                    setMostraCreaCompito(false); 
                    setCompitoDatiIniziali(null); 
                  }}
                ></button>
              </div>
              <div className="modal-body p-0">
                <CreaCompito
                  onCompitoCreato={handleCompitoCreato}
                  onCancella={() => { 
                    setMostraCreaCompito(false); 
                    setCompitoDatiIniziali(null); 
                  }}
                  datiIniziali={compitoDatiIniziali}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* modale per aggiungere la valutazione */}
      {compitoDaValutare && (
        <ValutazioneCompito
          compito={compitoDaValutare}
          onSalva={handleSalvaValutazione}
          onCancella={handleCancellaValutazione}
        />
      )}
    </div>
  );
}

export default DocenteDashboard;