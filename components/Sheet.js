// Grille de tableur, en lecture seule. Sert à illustrer une notion
// partout où une leçon parle de cellules.
//
// spec = {
//   cols, rows,
//   cells:  { "A1": "Produit", "B2": 89 },
//   notes:  { "C2": { show: "=B2*G1", state: "ok" | "bad" | "input" | "note" } },
//   focus:  ["G1"],              cellules encadrées
//   caption: "…"
// }

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

export function formatCell(v) {
  if (v === undefined || v === null || v === '') return '';
  if (typeof v === 'number') {
    const abs = Math.abs(v);
    if (abs > 0 && abs < 1) {
      return v.toLocaleString('fr-FR', { maximumFractionDigits: 4 });
    }
    return v.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
  }
  return String(v);
}

export default function Sheet({ spec, target, children }) {
  if (!spec) return null;

  const cols = Math.min(spec.cols ?? 6, LETTERS.length);
  const rows = spec.rows ?? 6;
  const cells = spec.cells ?? {};
  const notes = spec.notes ?? {};
  const focus = new Set(spec.focus ?? []);
  const letters = LETTERS.slice(0, cols);

  return (
    <figure className="sheet-fig">
      <div className="xl-gridwrap">
        <table className="xl-grid">
          <thead>
            <tr>
              <th className="xl-corner" aria-label="" />
              {letters.map((c) => <th key={c} scope="col">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, r) => (
              <tr key={r}>
                <th className="xl-rownum" scope="row">{r + 1}</th>
                {letters.map((c) => {
                  const ref = `${c}${r + 1}`;
                  const note = notes[ref];
                  const raw = cells[ref];
                  const isTarget = ref === target;
                  const shown = note?.show ?? formatCell(raw);
                  const isFormula = typeof shown === 'string' && shown.startsWith('=');
                  const isText = typeof raw === 'string' && !note?.show;

                  const cls = [
                    isTarget ? 'xl-target' : '',
                    focus.has(ref) ? 'xl-focus' : '',
                    note?.state ? `xl-${note.state}` : '',
                    isFormula ? 'xl-fx' : isText ? 'xl-text' : 'xl-num',
                  ].filter(Boolean).join(' ');

                  return (
                    <td key={ref} className={cls} title={ref}>
                      {isTarget ? <span className="xl-cursor">?</span> : shown}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(spec.caption || children) && (
        <figcaption className="sheet-cap">{spec.caption}{children}</figcaption>
      )}
    </figure>
  );
}
