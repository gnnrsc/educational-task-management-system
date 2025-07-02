[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/F9jR7G97)

# Exam #2: "Compiti"

## Student: s332938 ROSACE GIOVANNA

## React Client Application Routes

- Route `/`: Homepage con un messaggio di benvenuto che invoglia all'azione. Reindirizza automaticamente gli utenti autentificati alla propria dashboard in base al ruolo, altrimenti indirizza al Login.
- Route `/login`: pagina di login con campo email e password per autentificarsi.
- Route `/docente/compiti`: dashboard docente che mostra tutti i compiti creati, con filtri e possibilità di creazione.
- Route `/docente/compiti/:id`: vista dettagliata di un compito specifico (id) per i docenti.
- Route `/docente/compiti/:id/valuta`: pagina per valutare le risposte degli studenti.
- Route `/docente/classe/stato`: medie dei voti della classe con la lista degli studenti e loro performance, con opzioni di ordinamento.
- Route `/studente/compiti`: dashboard studente con tutti i compiti assegnati, filtrabili anche per stato (aperto/chiuso).
- Route `/studente/compiti/:id`: vista dettagliata di un compito specifico (id) per studenti.
- Route `/studente/compiti/:id/rispondi`: pagina per rispondere o modificare la risposta del compito.
- Route `/studente/valutazioni`: pagina con i voti e le performance degli studenti.

#### **Modal Routes (**Gestione Modali tramite Parametri URL**)**

Per la creazione dei compiti da parte del docente, sono stati utilizzati modali (in 2 step) con gestione dello stato basata su URL:

* Route `/docente/compiti?modal=crea`: modal creazione compito - appena aperto.
* Route `/docente/compiti?modal=crea&step=1`: modal creazione compito - Step 1 (inserimento domanda).
* Route `/docente/compiti?modal=crea&step=2`: modal creazione compito - Step 2 (selezione studenti del gruppo).
* Route `/docente/compiti?modal=crea&assegna=:id`: modal riassegnazione compito esistente (id) ad un nuovo gruppo.

*Caratteristiche avanzate aggiunte*:

- Deep linking diretto ai modali: l'URL apre direttamente un modal specifico in un determinato stato.
- Persistenza stato durante refresh: lo stato del modale del primo step sopravvive al refresh della pagina, grazie alla combinazione di URL params e sessionStorage.
- Navigazione browser (pulsanti Indietro/Avanti) integrata.
- SessionStorage per dati temporanei del form: per salvare dati da non esporre nell'URL, ma che devono persistere in caso di errori nei vari step (domanda).

Queste caratteristiche avanzate sono state implementate per superare le limitazioni dei modali, rispetto all'uso di una normale pagina per la creazione di un compito.

## API Server

### Route di Autenticazione

**POST `/api/sessions`**

- Request body: `{ email: string, password: string }`
- Response body: oggetto utente `{ id, email, nome, cognome, ruolo }` oppure messaggio di errore

**DELETE `/api/sessions/current`**

- Response body: vuoto (status 200)

**GET `/api/sessions/current`**

- Response body: oggetto utente corrente oppure errore se non autenticato

### Route per Docenti

**GET `/api/docente/classe`**

- Response body: array di studenti `[{ id, nome, cognome }]`

**POST `/api/docente/compiti`**

- Request body: `{ traccia: string, studentiIds: number[] }`
- Response body: oggetto compito creato oppure errore di conflitto per limiti di collaborazione

**GET `/api/docente/classe/collaborazioni`**

- Parametri della richiesta: `minCount` (opzionale, default: 2)
- Response body: oggetto con le coppie di studenti che hanno il conteggio di collaborazioni >=minCount `{ "1-2", "2-3" }` (gli studenti con id 1 ed id 2 hanno collaborato due volte insieme ecc.)

**PUT `/api/docente/compiti/:id/valuta`**

- Parametri della richiesta: `:id` (ID del compito)
- Request body: `{ punteggio: number, ultimaModificaRisposta?: string }`
- Response body: conferma di successo e punteggio, oppure errore di conflitto (compito già chiuso / risposta modificata)

**GET `/api/docente/classe/stato`**

- Parametri della richiesta: `sort` (opzionale: "media", "alfabetico", "totale")
- Response body: array di statistiche degli studenti con voti e conteggio compiti

**GET `/api/docente/compiti`**

- Response body: array dei compiti del docente con info base e stato della risposta

**GET `/api/docente/compiti/:id`**

- Parametri della richiesta: `:id` (ID del compito)
- Response body: oggetto dettagliato del compito con membri del gruppo e risposta

### Route per Studenti

**GET `/api/studente/compiti`**

- Parametri della richiesta: `stato` (opzionale: "aperto", "chiuso")
- Response body: array di compiti dello studente con filtro e totale

**PUT `/api/studente/compiti/:id/rispondi`**

- Parametri della richiesta: `:id` (ID del compito)
- Request body: `{ testo_risposta: string, ultimaModificaRisposta?: string }`
- Response body: oggetto risposta aggiornato/creato oppure errore di conflitto (compito chiuso / risposta modificata da un altro membro)

**GET `/api/studente/media`**

- Response body: media voti del singolo studente e totale compiti

**GET `/api/studente/compiti/:id`**

- Parametri della richiesta: `:id` (ID del compito)
- Response body: oggetto dettagliato del compito con info su gruppo e risposta

## Database Tables

- Table `users` - contains xx yy zz
- Table `something` - contains ww qq ss
- ...

## Main React Components

- [`CreaCompito`](client/src/components/modals/CreaCompito.jsx) (e sotto componenti): modale a più step per creare compiti con input della traccia e selezione degli studenti, con evidenziazione visuale del limite delle collaborazioni. Incluso inoltre il rilevamento dei conflitti di collaborazione, persistenza temporanea della traccia della domanda, gestione dello stato basato su URL e transizioni animate tra gli step.
- [`ListaCompiti`](client/src/components/ListaCompiti.jsx): componente riutilizzabile per docenti e studenti, mostra l'elenco dei compiti in formato tabellare con filtri, azioni e funzionalità basate sul ruolo. E' presente inoltre un menu kebab con gestione del click al di fuori, per consentire la riassegnazione automatica di un compito già esistente ad un altro gruppo.
- [`AuthContext`](client/src/AuthContext.jsx): uso di un contesto per la gestione globale dell'autentificazione, evitando prop drilling.
- [`RisoluzioneConflitti`](client/src/components/utils/RisoluzioneConflitti.jsx): gestione dei conflitti per le risposte modificate contemporaneamente dagli studenti, consente la scelta della versione da mantenere.
- [`ProtectedRoute`](client/src/components/utils/ProtectedRoute.jsx): componente di protezione delle rotte che garantisce l’accesso solo agli utenti autenticati con ruolo appropriato.

## Screenshot

##### Crea compito:

![Crea Compito](./demo/crea_compito.gif)

##### Stato della classe:

![Stato Classe](./demo/stato_classe.jpg)

## Users Credentials

- username, password (plus any other requested info)
- username, password (plus any other requested info)
