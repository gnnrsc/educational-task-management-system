import dayjs from 'dayjs';
import { Utente } from './Utente.mjs';

function Risposta(testo, aggiornato_il, inviato_da) {
  this.testo = testo;
  this.aggiornato_il = dayjs(aggiornato_il);
  this.inviato_da = new Utente(inviato_da.id, inviato_da.nome, inviato_da.cognome);

  this.serialize = () => ({
    testo: this.testo,
    aggiornato_il: this.aggiornato_il.format('YYYY-MM-DD HH:mm:ss'),
    inviato_da: this.inviato_da.serialize(),
  });
}

function Compito(data) {
  this.id = data.id;
  this.traccia = data.traccia;
  this.stato = data.stato;
  this.creato_il = dayjs(data.creato_il).format('YYYY-MM-DD HH:mm:ss');
  this.chiuso_il = data.chiuso_il ? dayjs(data.chiuso_il) : null;
  this.numero_studenti = data.numero_studenti;
  this.punteggio = data.punteggio ?? null;
  //creato_da
  this.docente = data.docente ? new Utente(data.docente.id, data.docente.nome, data.docente.cognome) : undefined;

  this.gruppo = data.gruppo ? data.gruppo.map(p => new Utente(p)) : [];
  this.ha_risposta = data.ha_risposta ?? undefined;
  this.risposta = data.risposta ? new Risposta(data.risposta.testo, data.risposta.aggiornato_il, data.risposta.inviato_da) : undefined;

  this.serialize = () => ({
    id: this.id,
    traccia: this.traccia,
    stato: this.stato,
    creato_il: this.creato_il.format('YYYY-MM-DD HH:mm:ss'),
    chiuso_il: this.chiuso_il?.format('YYYY-MM-DD HH:mm:ss') ?? null,
    numero_studenti: this.numero_studenti,
    gruppo: this.gruppo.map(p => p.serialize()),
    ...(this.docente && { docente: this.docente.serialize() }),
    ...(this.ha_risposta !== undefined && { ha_risposta: this.ha_risposta }),
    punteggio: this.punteggio,
    ...(this.risposta && { risposta: this.risposta.serialize() }),
  });
}

export { Compito, Risposta };
