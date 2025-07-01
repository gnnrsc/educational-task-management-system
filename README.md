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

**Modal Routes (**Gestione Modali tramite Parametri URL**)**

Il sistema di creazione compiti utilizza una gestione dello stato basata su URL, per gestire modali complessi con navigazione persistente:

* Route `/docente/compiti?modal=crea`: Modal creazione compito - appena aperto.
* Route `/docente/compiti?modal=crea&step=1`: Modal creazione compito - Step 1 (inserimento domanda).
* Route `/docente/compiti?modal=crea&step=2`: Modal creazione compito - Step 2 (selezione studenti del gruppo).
* Route `/docente/compiti?modal=crea&assegna=:id`: Modal riassegnazione compito esistente (id) ad un nuovo gruppo.

*Caratteristiche avanzate*:

- Deep linking diretto ai modali: l'URL apre direttamente un modal specifico in un determinato stato.
- Persistenza stato durante refresh: lo stato del modale del primo step sopravvive al refresh della pagina, grazie alla combinazione di URL params e sessionStorage.
- Navigazione browser (pulsanti Indietro/Avanti) integrata.
- SessionStorage per dati temporanei del form: per salvare dati da non esporre nell'URL, ma che devono persistere in caso di errori nei vari step (domanda).

Queste caratteristiche avanzate sono state implementate per superare le limitazioni dei modali, rispetto all'uso di una normale pagina per la creazione di un compito.

## API Server

### Route di Autenticazione

**POST `/api/sessions`**

- Request body: `{ email: string, password: string }`
- Response body: Oggetto utente `{ id, email, nome, cognome, ruolo }` oppure messaggio di errore

**DELETE `/api/sessions/current`**

- Response body: Vuoto (status 200)

**GET `/api/sessions/current`**

- Response body: Oggetto utente corrente oppure errore se non autenticato

### Route per Docenti

**GET `/api/docente/classe`**

- Response body: Array di studenti `[{ id, nome, cognome }]`

**POST `/api/docente/compiti`**

- Request body: `{ traccia: string, studentiIds: number[] }`
- Response body: Oggetto compito creato oppure errore di conflitto per limiti di collaborazione

**GET `/api/docente/classe/collaborazioni`**

- Parametri della richiesta: `minCount` (opzionale, default: 2)
- Response body: Oggetto con le coppie di studenti che hanno il conteggio di collaborazioni >=minCount `{ "1-2", "2-3" }` (coppia di studenti 1 e 2 ha 2 collaborazioni ecc.)

**PUT `/api/docente/compiti/:id/valuta`**

- Parametri della richiesta: `:id` (ID del compito)
- Request body: `{ punteggio: number, ultimaModificaRisposta?: string }`
- Response body: Conferma di successo e punteggio, oppure errore di conflitto (compito già chiuso / risposta modificata)

**GET `/api/docente/classe/stato`**

- Parametri della richiesta: `sort` (opzionale: "media", "alfabetico", "totale")
- Response body: Array di statistiche degli studenti con voti e conteggio compiti

**GET `/api/docente/compiti`**

- Response body: Array dei compiti del docente con info base e stato della risposta

**GET `/api/docente/compiti/:id`**

- Parametri della richiesta: `:id` (ID del compito)
- Response body: Oggetto dettagliato del compito con membri del gruppo e risposta

### Route per Studenti

**GET `/api/studente/compiti`**

- Parametri della richiesta: `stato` (opzionale: "aperto", "chiuso")
- Response body: Array di compiti dello studente con filtro e totale

**PUT `/api/studente/compiti/:id/rispondi`**

- Parametri della richiesta: `:id` (ID del compito)
- Request body: `{ testo_risposta: string, ultimaModificaRisposta?: string }`
- Response body: Oggetto risposta aggiornato oppure errore di conflitto (compito chiuso / risposta modificata da un altro membro)

**GET `/api/studente/media`**

- Response body: Media voti del singolo studente e totale compiti

**GET `/api/studente/compiti/:id`**

- Parametri della richiesta: `:id` (ID del compito)
- Response body: Oggetto dettagliato del compito con info su gruppo e risposta

## Database Tables

- Table `users` - contains xx yy zz
- Table `something` - contains ww qq ss
- ...

## Main React Components

- `ListOfSomething` (in `List.js`): component purpose and main functionality
- `GreatButton` (in `GreatButton.js`): component purpose and main functionality
- ...

(only _main_ components, minor ones may be skipped)

## Screenshot

![Screenshot](./img/screenshot.jpg)

## Users Credentials

- username, password (plus any other requested info)
- username, password (plus any other requested info)
