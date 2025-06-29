import { useState, useEffect, use } from "react";
import { useNavigate, useSearchParams, useLocation} from 'react-router';
import CreaCompito from "../CreaCompito";
import ListaCompiti from "../ListaCompiti";
import LoadingSpinner from "../utils/LoadingSpinner";
import ConfermaSuccesso from "../utils/ConfermaSuccesso";
import API from "../../API";


function DocenteDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conferma, setConferma] = useState({});
  
  // stati principali per caricamento compiti e gestione dei caricamenti
  const [compiti, setCompiti] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // lettura parametri URL per gestire modali e stati
  const modalParam = searchParams.get('modal');     
  const stepParam = searchParams.get('step');             
  const assegnaParam = searchParams.get('assegna');       
  
  // stati derivati dall'URL
  const mostraCreaCompito = modalParam === 'crea';
  const stepCorrente = stepParam ? parseInt(stepParam) : 1;
  const compitoDatiIniziali = assegnaParam && compiti.length > 0 
    ? compiti.find(c => c.id === parseInt(assegnaParam)) 
    : null;
  
  // stato persistente per salvare la domanda (non esponendola in URL)
  const domandaSalvata = sessionStorage.getItem('creaCompito_domanda') || "";

  // carica compiti all'avvio
  useEffect(() => {
    const caricaCompiti = async () => {
      setLoading(true);
      try {
        const response = await API.ottieniCompitiDocente();
        setCompiti(response.compiti);
      } catch (error) {
        setCompiti([]);
      }
      setLoading(false);
    };

    caricaCompiti();
  }, []);

  // validazione step 2 all'avvio (serve domanda salvata nel caso si apra direttamente l'url con step 2)
  // altrimenti reindirizza a step 1
  useEffect(() => {
    if (stepCorrente === 2) {
      if (!domandaSalvata) {
        searchParams.set("step", "1");
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, []);
  //gestione della conferma dopo le operazioni di assegnazione da DettaglioCompito e valutazione compito
  useEffect(() => {
  if(location.state?.conferma) {
    const messaggi = {
      'compito-assegnato': 'Compito assegnato con successo ad un nuovo gruppo!',
      'valutazione-completata': location.state.messaggio || 'Valutazione completata con successo!'
    };

    setConferma({
      mostra: true,
      tipo: location.state.conferma,
      messaggio: messaggi[location.state.conferma] || 'Operazione completata!'
    });
    
    // rimuove lo stato per evitare che si ripeta alla navigazione
    navigate(location.pathname, { replace: true, state: {} });
  }
}, [location.state, location.pathname]);

  // GESTORI PER CAMBIARE URL
  
  const apriCreaCompito = () => {
    setSearchParams({ modal: 'crea' });
  };

  const chiudiTuttiIModali = () => {
    sessionStorage.removeItem('creaCompito_domanda');
    if (searchParams.get('step') == 2) {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({});
    }
  };

  const salvaStatoForm = (step, domanda, isUserAction = false) => {
    // salva sempre in sessionStorage la domanda corrente se è presente
    if (domanda.trim()) {
      sessionStorage.setItem('creaCompito_domanda', domanda.trim());
    } else {
      sessionStorage.removeItem('creaCompito_domanda');
    }
    
    // aggiorna URL non appena l'utente cambia step o modifica la domanda
    if (isUserAction) {
      const params = new URLSearchParams(searchParams);
      params.set('modal', 'crea');
      params.set('step', step.toString());
      setSearchParams(params);
    }
  };

  // naviga alla pagina di valutazione ricordando che si arriva da lista compiti
  
  const apriValutazione = (compito) => {
    navigate(`/docente/compiti/${compito.id}/valutazione`, { 
      state: { daDettaglio: false } 
    });
  };

  // GESTORI COMPITI
  
  const handleCompitoCreato = (nuovoCompito) => {
    setCompiti(prev => [nuovoCompito, ...prev]);
    // controlla se era un'assegnazione o una creazione
    const eraAssegnazione = compitoDatiIniziali !== null;
    
    // Mostra la conferma appropriata
    setConferma({
      mostra: true,
      tipo: eraAssegnazione ? 'compito-assegnato' : 'compito-creato',
      messaggio: eraAssegnazione 
        ? `Compito assegnato con successo ad un nuovo gruppo!`
        : `Compito creato con successo!`
    });
    chiudiTuttiIModali();
  };

  //cambia pagina al dettaglio del compito
  const handleApriDettaglio = (compitoId) => {
    navigate(`/docente/compiti/${compitoId}`);
  };

// funzione per gestire l'assegnazione dello stesso compito ad un altro gruppo
  const handleAssegnaAltroGruppo = (compito) => {
    setSearchParams({ 
      modal: 'crea', 
      assegna: compito.id.toString() 
    });
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
          onClick={apriCreaCompito}
        >
          ➕ Crea Nuovo Compito
        </button>
      </div>

      <ListaCompiti 
        compiti={compiti}
        onApriDettaglio={handleApriDettaglio}
        onApriValutazione={apriValutazione} 
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
                  onClick={chiudiTuttiIModali}
                ></button>
              </div>
              <div className="modal-body p-0">
                <CreaCompito
                  onCompitoCreato={handleCompitoCreato}
                  onCancella={chiudiTuttiIModali}
                  datiIniziali={compitoDatiIniziali}
                  stepIniziale={stepCorrente}
                  domandaIniziale={domandaSalvata}
                  onSalvaStato={salvaStatoForm}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      <ConfermaSuccesso
        {...conferma}
        onChiudi={() => setConferma({})}
      />
    </div>
  );
}

export default DocenteDashboard;