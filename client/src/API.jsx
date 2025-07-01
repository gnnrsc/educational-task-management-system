import { Compito, Risposta } from "./models/Compito.mjs";
import { Utente, StatisticheStudente } from "./models/Utente.mjs";
// default URL
const URL = "http://localhost:3001/api";

async function logIn(credentials) {
  let response = await fetch(URL + "/sessions", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });
  if (response.ok) {
    const user = await response.json();
    return user;
  } else {
    const err = await response.json();
    const error = new Error(err.message || "Errore di autenticazione");
    error.status = response.status; 
    throw error;
  }
}

async function logOut() {
  await fetch(URL + "/sessions/current", {
    method: "DELETE",
    credentials: "include",
  });
}

async function ottieniInformazioniUtente() {
  const response = await fetch(URL + "/sessions/current", {
    credentials: "include",
  });
  const userInfo = await response.json();
  if (response.ok) {
    return userInfo;
  } else {
    throw userInfo;
  }
}

// STUDENTE

// GET: /api/studente/compiti - Visualizza tutti i compiti dello studente con filtro opzionale
async function ottieniCompitiStudente(stato = null) {
  const queryParam = stato ? `?stato=${stato}` : "";
  const response = await fetch(URL + `/studente/compiti${queryParam}`, {
    credentials: "include",
  });
  const data = await response.json();
  if (response.ok) {
    return {
      filtro: data.filtro,
      totale: data.totale,
      compiti: data.compiti.map((compito) => new Compito(compito)),
    };
  } else {
    throw data;
  }
}

// PUT: /api/studente/compiti/:id/rispondi - Inserisce o aggiorna la risposta a un compito
async function aggiornaRispostaCompito(compitoId, testoRisposta) {
  const response = await fetch(
    URL + `/studente/compiti/${compitoId}/rispondi`,
    {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ testo_risposta: testoRisposta }),
    }
  );
  
  const data = await response.json();
  
  if (response.ok) {
    // controlla se è un successo o un conflitto
    if (data.success === false && data.conflict) {
      // crea un errore personalizzato per i conflitti
      const customError = new Error(data.error);
      customError.isConflict = true;
      customError.codice = data.codice;
      customError.error = data.error;
      throw customError;
    }
    
    // ritorna il successo reale
    return data.data || data;
  } else {
    // altri errori (404, 500, ecc.)
    console.error(`Errore API ${response.status}:`, data);
    throw data;
  }
}

// GET: /api/studente/media - Visualizza la media dello studente
async function ottieniMediaStudente() {
  const response = await fetch(URL + "/studente/media", {
    credentials: "include",
  });
  const data = await response.json();
  if (response.ok) {
    return {
      studente: new Utente(data.studente),
      totale_compiti: data.totale_compiti,
      media: data.media,
    };
  } else {
    throw data;
  }
}

// GET: /api/studente/compiti/:id - Visualizza i dettagli di un compito specifico
async function ottieniCompitoDettaglioStudente(compitoId) {
  const response = await fetch(URL + `/studente/compiti/${compitoId}`, {
    credentials: "include",
  });
  const data = await response.json();
  if (response.ok) {
    return new Compito(data);
  } else {
    throw data;
  }
}

//  DOCENTE

// GET: /api/docente/classe - Ottenere lista studenti (solo per docenti)
async function ottieniStudenti() {
  const response = await fetch(URL + "/docente/classe", {
    credentials: "include",
  });
  const data = await response.json();
  if (response.ok) {
    return data.map((studente) => new Utente(studente));
  } else {
    throw data;
  }
}

// GET: /api/docente/classe/collaborazioni - Ottenere le collaborazioni tra coppie di studenti
async function ottieniCollaborazioniClasse(minCount = 2) {
  const queryParam = minCount ? `?minCount=${minCount}` : "";
  const response = await fetch(
    URL + `/docente/classe/collaborazioni${queryParam}`,
    {
      credentials: "include",
    }
  );

  const data = await response.json();

  if (response.ok) {
    return {
      docenteId: data.docenteId,
      minCount: data.minCount,
      collaborazioni: data.collaborazioni, // Oggetto con le coppie di studenti come chiavi e il numero di collaborazioni come valori
    };
  } else {
    throw data;
  }
}

// POST: /api/docente/compiti - Creare un nuovo compito (solo per docenti)
async function creaCompito(traccia, studentiIds) {
  const response = await fetch(URL + "/docente/compiti", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ traccia, studentiIds }),
  });
  
  const data = await response.json();
  
  if (response.ok) {
    // controlla se è un successo o un conflitto
    if (data.success === false && data.conflict) {
      // crea un errore personalizzato per i conflitti
      const customError = new Error(data.error);
      customError.isConflict = true;
      customError.codice = data.codice;
      customError.error = data.error;
      customError.dettagli = data.dettagli;
      throw customError;
    }

    // ritorna il successo reale
    return data.data || data;
  } else {
    // altri errori (404, 500, ecc.)
    console.error(`Errore API ${response.status}:`, data);
    throw data;
  }
}

// PUT: /api/docente/compiti/:id/valuta - Effettuare una valutazione di un compito (solo per docenti)
async function valutaCompito(compitoId, punteggio, ultimaModificaRisposta = null) {
  const body = { punteggio };
  if (ultimaModificaRisposta) {
    body.ultimaModificaRisposta = ultimaModificaRisposta;
  }

  const response = await fetch(
    URL + `/docente/compiti/${compitoId}/valuta`,
    {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  
  const data = await response.json();
  
  if (response.ok) {
    // Controlla se è un successo o un conflitto
    if (data.success === false && data.conflict) {
      // Crea un errore personalizzato per i conflitti
      const customError = new Error(data.error);
      customError.isConflict = true;
      customError.codice = data.codice;
      customError.error = data.error;
      throw customError;
    }
    
    // Successo reale
    return data.data || data;
  } else {
    // Altri errori (404, 500, ecc.)
    console.error(`Errore API ${response.status}:`, data);
    throw data;
  }
}

// GET: /api/docente/classe/stato - Ottenere statistiche della classe (solo per docenti)
async function ottieniStatisticheClasse(sort = "alfabetico") {
  const queryParam = sort ? `?sort=${sort}` : "";
  const response = await fetch(URL + `/docente/classe/stato${queryParam}`, {
    credentials: "include",
  });
  const data = await response.json();
  if (response.ok) {
    return {
      ordinamento: data.ordinamento,
      studenti: data.studenti.map((item) => new StatisticheStudente(item)),
    };
  } else {
    throw data;
  }
}

// GET: /api/docente/compiti - Visualizza tutti i compiti creati dal docente
async function ottieniCompitiDocente() {
  const response = await fetch(URL + `/docente/compiti`, {
    credentials: "include",
  });
  const data = await response.json();
  if (response.ok) {
    return {
      totale: data.totale,
      compiti: data.compiti.map(
        (compito) =>
          new Compito({
            ...compito,
          })
      ),
    };
  } else {
    throw data;
  }
}

// GET: /api/docente/compiti/:id - Visualizza il dettaglio di un compito (solo per docente)
async function ottieniCompitoDettaglioDocente(compitoId) {
  const response = await fetch(URL + `/docente/compiti/${compitoId}`, {
    credentials: "include",
  });
  const data = await response.json();
  if (response.ok) {
    return new Compito(data);
  } else {
    throw data;
  }
}

const API = {
  logIn,
  logOut,
  ottieniInformazioniUtente,
  ottieniCompitiStudente,
  aggiornaRispostaCompito,
  ottieniMediaStudente,
  ottieniCompitoDettaglioStudente,
  ottieniStudenti,
  ottieniCollaborazioniClasse,
  creaCompito,
  valutaCompito,
  ottieniStatisticheClasse,
  ottieniCompitiDocente,
  ottieniCompitoDettaglioDocente,
};

export default API;
