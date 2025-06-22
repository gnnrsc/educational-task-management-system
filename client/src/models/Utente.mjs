function Utente(data) {
  this.id = data.id;
  this.email = data.email ?? null;
  this.nome = data.nome;
  this.cognome = data.cognome;
  this.ruolo = data.ruolo ?? null;

  this.serialize = () => ({
    id: this.id,
    email: this.email,
    nome: this.nome,
    cognome: this.cognome,
    ruolo: this.ruolo,
  });
}

function StatisticheStudente(data) {
  this.studente = new Utente(data.studente.id, data.studente.nome, data.studente.cognome);
  this.totale_compiti = data.totale_compiti ?? 0;
  this.compiti_aperti = data.compiti_aperti ?? null;  // potrebbe non esserci nella media
  this.compiti_chiusi = data.compiti_chiusi ?? null;  // idem
  this.media = data.media ?? null;

  this.serialize = () => ({
    studente: this.studente.serialize(),
    totale_compiti: this.totale_compiti,
    compiti_aperti: this.compiti_aperti,
    compiti_chiusi: this.compiti_chiusi,
    media: this.media,
  });
}

export {  Utente, StatisticheStudente };

