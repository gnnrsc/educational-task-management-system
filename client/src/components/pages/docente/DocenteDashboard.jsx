import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation} from 'react-router';
import CreaCompito from "../../modals/CreaCompito";
import ListaCompiti from "../../ListaCompiti";
import LoadingSpinner from "../../utils/LoadingSpinner";
import ConfermaSuccesso from "../../utils/ConfermaSuccesso";
import API from "../../../API";


function DocenteDashboard() {
  const navigate = useNavigate();
  // per decidere che Conferma mostrare
  const location = useLocation();
  // per gestire i parametri URL e le modali
  const [searchParams, setSearchParams] = useSearchParams();
  
  
  // stati principali per caricamento compiti e gestione dei caricamenti
  const [compiti, setCompiti] = useState([]);
  const [loading, setLoading] = useState(true);

  // stato per gestire la conferma dopo operazioni di valutazione o creazione compito
  const [conferma, setConferma] = useState({});
  
  // lettura parametri URL per gestire modali e stati
  const modalParam = searchParams.get('modal');     
  const stepParam = searchParams.get('step');       
  
  // stati derivati dall'URL
  const mostraCreaCompito = modalParam === 'crea';
  const stepCorrente = stepParam ? parseInt(stepParam) : 1;
  
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

  //gestione della conferma dopo le operazioni di valutazione o creazione compito
  useEffect(() => {
    if(location.state?.conferma) {

      setConferma({
        mostra: true,
        tipo: location.state.conferma,
        messaggio: location.state.messaggio
      });
      
      // rimuove lo stato per evitare che si ripeta alla navigazione
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname]);

  // HANDLER PRINCIPALI
  
  const handleCompitoCreato = (nuovoCompito) => {
    setCompiti(prev => [nuovoCompito, ...prev]);
    
    // Mostra la conferma creazione compito
    setConferma({
      mostra: true,
      tipo: 'compito-creato',
      messaggio: `Compito creato con successo!`
    });
    chiudiTuttiIModali();
  };

  //cambia pagina al dettaglio del compito
  const handleApriDettaglio = (compitoId) => {
    navigate(`/docente/compiti/${compitoId}`);
  };

  // naviga alla pagina di valutazione ricordando che si arriva da lista compiti
  const handleApriValutazione = (compito) => {
    navigate(`/docente/compiti/${compito.id}/valuta`, { 
      state: { daDettaglio: false } 
    });
  };

  // HANDLER PER GESTIRE I MODALI (agendo sui parametri URL)

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

  // HANDLER PER SALVARE LO STATO DEL FORM (attraverso la sessionStorage)

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
        onApriValutazione={handleApriValutazione} 
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
                  "➕ Crea Nuovo Compito"
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
       //spacchetto l'oggetto conferma per passare tutte le props
        {...conferma}
        onChiudi={() => setConferma({})}
      />
    </div>
  );
}

export default DocenteDashboard;