'use client';

import { useState, useRef, useEffect } from 'react';
import { gradeFormula } from '@/app/excel-actions';

const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

function formatCell(v) {
  if (v === undefined || v === null || v === '') return '';
  if (typeof v === 'number') {
    const abs = Math.abs(v);
    if (abs > 0 && abs < 1) return v.toLocaleString('fr-FR', { maximumFractionDigits: 4 });
    return v.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
  }
  return String(v);
}

/**
 * Grille de travail + champ de formule.
 * La correction part au serveur : la solution n'est jamais dans la page.
 */
export default function ExcelExercise({ stepId, display = {}, cells = {}, target, hint, onSolved }) {
  const cols = display.cols ?? 5;
  const rows = display.rows ?? 8;
  const [value, setValue] = useState('=');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [tries, setTries] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    setValue('=');
    setResult(null);
    setTries(0);
    setShowHint(false);
  }, [stepId]);

  async function submit(e) {
    e?.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const r = await gradeFormula(stepId, value);
      setResult(r);
      setTries((n) => n + 1);
      if (r.correct) onSolved?.();
    } catch {
      setResult({ correct: false, message: 'La correction est momentanément indisponible.' });
    } finally {
      setBusy(false);
    }
  }

  const letters = COLS.slice(0, cols);

  return (
    <div className="xl-exo">
      <div className="xl-gridwrap">
        <table className="xl-grid">
          <thead>
            <tr>
              <th className="xl-corner" />
              {letters.map((c) => <th key={c}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, r) => (
              <tr key={r}>
                <th className="xl-rownum">{r + 1}</th>
                {letters.map((c) => {
                  const ref = `${c}${r + 1}`;
                  const raw = cells[ref];
                  const isTarget = ref === target;
                  const isText = typeof raw === 'string';
                  return (
                    <td
                      key={ref}
                      className={
                        (isTarget ? 'xl-target ' : '') +
                        (isText ? 'xl-text' : 'xl-num')
                      }
                      title={ref}
                    >
                      {isTarget ? <span className="xl-cursor">?</span> : formatCell(raw)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form className="xl-bar" onSubmit={submit}>
        <span className="xl-ref">{target ?? 'fx'}</span>
        <input
          ref={inputRef}
          className="xl-input"
          value={value}
          spellCheck={false}
          autoComplete="off"
          aria-label="Votre formule"
          onChange={(e) => {
            setValue(e.target.value);
            if (result) setResult(null);
          }}
        />
        <button className="btn btn-w btn-sm" type="submit" disabled={busy}>
          {busy ? 'Vérification…' : 'Valider'}
        </button>
      </form>

      {result && (
        <p className={result.correct ? 'xl-feedback ok' : 'xl-feedback ko'} role="status">
          {result.message}
        </p>
      )}

      {!result?.correct && hint && (
        showHint
          ? <p className="xl-hint">{hint}</p>
          : tries >= 1 && (
              <button type="button" className="xl-hintbtn" onClick={() => setShowHint(true)}>
                Afficher un indice
              </button>
            )
      )}
    </div>
  );
}
