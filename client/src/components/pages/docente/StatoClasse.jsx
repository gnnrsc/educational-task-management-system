import { useState } from 'react';
import ListaStudenti from '../../ListaStudenti';

function StatoClasse() {
  const [ordinamento, setOrdinamento] = useState('alfabetico');

  const handleOrdinamentoCambia = (nuovoOrdinamento) => {
    setOrdinamento(nuovoOrdinamento);
  };

  return (
    <div className="container my-3">
        {/* breadcrumb compatto iniziale */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item active">
            📊 Stato della Classe
          </li>
        </ol>
      </nav>

      {/* filtri ordinamento */}
      <div className="d-flex flex-wrap gap-3 mb-4 align-items-center">
        <div>
          <label className="fw-semibold me-2">Ordina per:</label>
          {[
            { value: 'alfabetico', label: 'Alfabetico' },
            { value: 'totale', label: 'Totale compiti' },
            { value: 'media', label: 'Media voti' }
          ].map((opzione) => (
            <button
              key={opzione.value}
              onClick={() => handleOrdinamentoCambia(opzione.value)}
              className={`btn btn-sm me-1 ${
                ordinamento === opzione.value
                  ? "btn-outline-primary active"
                  : "btn-outline-secondary"
              }`}
            >
              {opzione.label}
            </button>
          ))}
        </div>
      </div>

      <ListaStudenti ordinamento={ordinamento} />

      {/* legenda */}
      <div className="mt-4">
        <div className="card">
          <div className="card-body">
            <h6 className="card-title mb-3">📖 Legenda Valutazioni</h6>
            <div className="row">
              <div className="col-md-6">
                <small className="text-muted">
                  <strong>🎯 Scala di valutazione:</strong><br/>
                  • 27-30: Eccezionale<br/>
                  • 24-26: Eccellente<br/>
                  • 21-23: Buono<br/>
                  • 18-20: Sufficiente<br/>
                  • 0-17: Insufficiente
                </small>
              </div>
              <div className="col-md-6">
                <small className="text-muted">
                  <strong>📊 Statistiche:</strong><br/>
                  • Studenti: numero studenti nella classe<br/>
                  • Media: media voti dei compiti chiusi<br/>
                  • Eccellenti: numero di studenti con media dei voti superiore a 24<br/>
                  • Insufficienti: numero di studenti con media dei voti inferiore a 18
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatoClasse;