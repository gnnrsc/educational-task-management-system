import { useState, useEffect } from "react";
import { useNavigate } from 'react-router';
import CreaCompito from "../CreaCompito";
import ListaCompiti from "../ListaCompiti";
import ValutazioneCompito from "../ValutazioneCompito"; 
import LoadingSpinner from "../utils/LoadingSpinner";
import API from "../../API";

function DocenteDashboard() {
  const navigate = useNavigate();
  const [showCreaCompito, setShowCreaCompito] = useState(false);
  const [compitoInitialData, setCompitoInitialData] = useState(null);
  const [compiti, setCompiti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [compitoDaValutare, setCompitoDaValutare] = useState(null);
  const [filtroStato, setFiltroStato] = useState("tutti"); 
  
  useEffect(() => {
    loadCompiti();
  }, []);

  // ricarica i compiti quando cambia il filtro
  useEffect(() => {
    if (!loading) { // evita il doppio caricamento iniziale
      loadCompiti();
    }
  }, [filtroStato]);

  const loadCompiti = async () => {
    setLoading(true);
    try {
      const statoParam = filtroStato === "tutti" ? null : filtroStato;
      const response = await API.getCompitiDocente(statoParam);
      
      // la risposta contiene { filtro, totale, compiti }
      setCompiti(response.compiti);
    } catch (error) {
      console.error("Errore nel caricamento compiti:", error);
      setCompiti([]);
    }
    setLoading(false);
  };

  // FUNZIONI PER LA VALUTAZIONE-------------------
  const handleOpenValutazione = (compito) => {
    setCompitoDaValutare(compito);
  };

  const handleSaveValutazione = async (punteggio) => {
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

  const handleCancelValutazione = () => {
    setCompitoDaValutare(null);
  };

  // ----------------------------------------------

  //cambia pagina al dettaglio del compito
  const handleOpenDettaglio = (compitoId) => {
    navigate(`/docente/compiti/${compitoId}`);
  };

  // gestione della creazione di un nuovo compito
  const handleCompitoCreato = async (nuovoCompito) => {
    try {
      const compitoPerLista = nuovoCompito;

      // aggiungo il nuovo compito in cima alla lista
      setCompiti(prev => [compitoPerLista, ...prev]);
      
      // chiudo il modal solo DOPO aver aggiornato con successo
      setShowCreaCompito(false);
      setCompitoInitialData(null);

    } catch (error) {
      //console.error("Errore nell'aggiornamento della lista:", error);
      // il modale rimane aperto se c'è un errore nell'aggiornamento
    }
  };

  // funzione per gestire l'assegnazione dello stesso compito ad un altro gruppo
  const handleAssegnaAltroGruppo = (compito) => {
    setCompitoInitialData(compito);
    setShowCreaCompito(true);
  };

  // funzione per gestire il cambio di filtro
  const handleFiltroChange = (nuovoFiltro) => {
    setFiltroStato(nuovoFiltro);
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
          onClick={() => setShowCreaCompito(true)}
        >
          ➕ Crea Nuovo Compito
        </button>
      </div>

      <ListaCompiti 
        compiti={compiti}
        filtroStato={filtroStato}
        onFiltroChange={handleFiltroChange}
        onOpenDettaglio={handleOpenDettaglio}
        onOpenValutazione={handleOpenValutazione} 
        onAssegnaAltroGruppo={handleAssegnaAltroGruppo}
      />

      {/* modale per creare nuovo compito */}
      {showCreaCompito && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog" style={{ maxWidth: '1400px' }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {compitoInitialData ? "📋 Assegna Compito ad un altro Gruppo" : "➕ Crea Nuovo Compito"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => { 
                    setShowCreaCompito(false); 
                    setCompitoInitialData(null); 
                  }}
                ></button>
              </div>
              <div className="modal-body p-0">
                <CreaCompito
                  onCompitoCreato={handleCompitoCreato}
                  onCancel={() => { 
                    setShowCreaCompito(false); 
                    setCompitoInitialData(null); 
                  }}
                  initialData={compitoInitialData}
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
          onSave={handleSaveValutazione}
          onCancel={handleCancelValutazione}
        />
      )}
    </div>
  );
}

export default DocenteDashboard;