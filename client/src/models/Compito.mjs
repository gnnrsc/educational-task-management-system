import dayjs from 'dayjs';
import { Utente } from './Utente.mjs';

function Risposta(testo, aggiornato_il, inviato_da) {
  this.testo = testo;
  this.aggiornato_il = dayjs(aggiornato_il);
  this.inviato_da = new Utente(inviato_da);

  this.serialize = () => ({
    testo: this.testo,
    aggiornato_il: this.aggiornato_il.format('DD/MM/YYYY [alle] HH:mm'),
    inviato_da: this.inviato_da.serialize(),
  });
}

function Compito(data) {
  this.id = data.id;
  this.traccia = data.traccia;
  this.stato = data.stato;
  this.creato_il = dayjs(data.creato_il);
  this.chiuso_il = data.chiuso_il ? dayjs(data.chiuso_il) : null;
  this.numero_studenti = data.numero_studenti;
  this.punteggio = data.punteggio ?? null;
  //creato_da
  this.docente = data.docente ? new Utente(data.docente) : undefined;
  this.ha_risposta = data.ha_risposta ?? false; // indica se il compito ha una risposta
  this.gruppo = data.gruppo ? data.gruppo.map(p => new Utente(p)) : [];
  this.risposta = data.risposta ? new Risposta(data.risposta.testo, data.risposta.aggiornato_il, data.risposta.inviato_da) : undefined;

  this.serialize = () => ({
    id: this.id,
    traccia: this.traccia,
    stato: this.stato,
    creato_il: this.creato_il.format('DD/MM/YYYY [alle] HH:mm'),
    chiuso_il: this.chiuso_il?.format('DD/MM/YYYY [alle] HH:mm') ?? null,
    numero_studenti: this.numero_studenti,
    ha_risposta: this.ha_risposta,
    gruppo: this.gruppo.map(p => p.serialize()),
    ...(this.docente && { docente: this.docente.serialize() }),
    punteggio: this.punteggio,
    ...(this.risposta && { risposta: this.risposta.serialize() }),
  });
}

export { Compito, Risposta };
