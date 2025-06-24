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

async function getUserInfo() {
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
async function getCompitiStudente(stato = null) {
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

// PUT: /api/studente/compiti/:id/risposta - Inserisce o aggiorna la risposta a un compito
async function updateRispostaCompito(compitoId, testoRisposta) {
  const response = await fetch(
    URL + `/studente/compiti/${compitoId}/risposta`,
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
    return data; // Ritorna il messaggio di successo così com'è
  } else {
    throw data;
  }
}

// GET: /api/studente/media - Visualizza la media dello studente
async function getMediaStudente() {
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
async function getCompitoDettaglioStudente(compitoId) {
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
async function getStudenti() {
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
async function getCollaborazioniClasse(minCount = 2) {
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
async function createCompito(traccia, studentIds) {
  const response = await fetch(URL + "/docente/compiti", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ traccia, studentIds }),
  });
  const data = await response.json();
  if (response.ok) {
    return data; // Ritorna { id: compitoId }
  } else {
    throw data;
  }
}

// GET: /api/docente/compiti/:id/risposta - Ottenere la risposta di un compito (solo per docenti)
async function getRispostaCompito(compitoId) {
  const response = await fetch(URL + `/docente/compiti/${compitoId}/risposta`, {
    credentials: "include",
  });

  // Gestisce anche il caso 204 (nessuna risposta)
  if (response.status === 204) {
    return { message: "Nessuna risposta disponibile per questo compito" };
  }

  const data = await response.json();
  if (response.ok) {
    // Mappa la risposta se presente
    const mapped = {
      id: data.id,
      traccia: data.traccia,
      stato: data.stato,
      numero_studenti: data.numero_studenti,
      punteggio: data.punteggio,
    };

    if (data.risposta) {
      // Crea oggetto inviato_da per il costruttore Risposta
      const inviatoDa = {
        id: null, // Non disponibile nell'API del docente
        nome: data.risposta.inviato_da.split(" ")[0],
        cognome: data.risposta.inviato_da.split(" ").slice(1).join(" "),
      };

      mapped.risposta = new Risposta(
        data.risposta.testo,
        data.risposta.aggiornato_il,
        inviatoDa
      );
    }

    return mapped;
  } else {
    throw data;
  }
}

// PUT: /api/docente/compiti/:id/valutazione - Effettuare una valutazione di un compito (solo per docenti)
async function valutaCompito(compitoId, punteggio) {
  const response = await fetch(
    URL + `/docente/compiti/${compitoId}/valutazione`,
    {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ punteggio }),
    }
  );
  const data = await response.json();
  if (response.ok) {
    return data; // Ritorna { message: "Compito valutato", punteggio }
  } else {
    throw data;
  }
}

// GET: /api/docente/classe/stato - Ottenere statistiche della classe (solo per docenti)
async function getStatisticheClasse(sort = "alfabetico") {
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

// GET: /api/docente/compiti - Visualizza tutti i compiti creati dal docente con filtro opzionale
async function getCompitiDocente(stato = null) {
  const queryParam = stato ? `?stato=${stato}` : "";
  const response = await fetch(URL + `/docente/compiti${queryParam}`, {
    credentials: "include",
  });
  const data = await response.json();
  if (response.ok) {
    return {
      filtro: data.filtro,
      totale: data.totale,
      compiti: data.compiti.map(
        (compito) =>
          new Compito({
            ...compito,
            ha_risposta: compito.ha_risposta,
          })
      ),
    };
  } else {
    throw data;
  }
}

// GET: /api/docente/compiti/:id - Visualizza il dettaglio di un compito (solo per docente)
async function getCompitoDettaglioDocente(compitoId) {
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
  getUserInfo,
  getCompitiStudente,
  updateRispostaCompito,
  getMediaStudente,
  getCompitoDettaglioStudente,
  getStudenti,
  getCollaborazioniClasse,
  createCompito,
  getRispostaCompito,
  valutaCompito,
  getStatisticheClasse,
  getCompitiDocente,
  getCompitoDettaglioDocente,
};

export default API;
