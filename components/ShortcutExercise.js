'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Entraînement aux raccourcis : on capte les vraies touches.
 *
 * spec = {
 *   goal: "Sélectionner jusqu'à la dernière cellule remplie vers le bas",
 *   keys: ["Control", "Shift", "ArrowDown"],
 *   display: "Ctrl + Maj + ↓",
 *   mac: "Cmd + Maj + ↓"
 * }
 */

const PRETTY = {
  Control: 'Ctrl', Meta: 'Cmd', Alt: 'Alt', Shift: 'Maj',
  ArrowDown: '↓', ArrowUp: '↑', ArrowLeft: '←', ArrowRight: '→',
  Enter: 'Entrée', Escape: 'Échap', ' ': 'Espace', Tab: 'Tab',
  Delete: 'Suppr', Backspace: 'Retour',
};

const label = (k) => PRETTY[k] ?? (k.length === 1 ? k.toUpperCase() : k);

export default function ShortcutExercise({ spec, onSolved }) {
  const [held, setHeld] = useState([]);
  const [result, setResult] = useState(null);
  const [armed, setArmed] = useState(false);
  const zone = useRef(null);
  const solvedRef = useRef(false);

  useEffect(() => {
    if (!armed) return;

    const want = spec.keys.map((k) => k.toLowerCase()).sort();

    function pressed(e) {
      const set = new Set();
      if (e.ctrlKey) set.add('control');
      if (e.metaKey) set.add('meta');
      if (e.altKey) set.add('alt');
      if (e.shiftKey) set.add('shift');
      if (!['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) {
        set.add(e.key.toLowerCase());
      }
      return set;
    }

    function onKeyDown(e) {
      if (solvedRef.current) return;
      e.preventDefault();

      const set = pressed(e);
      setHeld([...set]);

      // On ne juge que lorsqu'une touche non-modificatrice est tombée.
      if (['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) return;

      const got = [...set].sort();
      // Cmd est accepté partout où Ctrl est attendu : le cours vise les deux systèmes.
      const normalise = (arr) => arr.map((k) => (k === 'meta' ? 'control' : k)).sort();
      const ok = JSON.stringify(normalise(got)) === JSON.stringify(normalise(want));

      setResult(ok ? 'ok' : 'ko');
      if (ok) {
        solvedRef.current = true;
        onSolved?.();
      }
    }

    function onKeyUp() {
      if (!solvedRef.current) setHeld([]);
    }

    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
    };
  }, [armed, spec.keys, onSolved]);

  return (
    <div className="sc-exo">
      <p className="ribbon-goal">
        <span className="ribbon-goal-k">Objectif</span>
        {spec.goal}
      </p>

      <button
        type="button"
        ref={zone}
        className={'sc-zone' + (armed ? ' armed' : '') + (result ? ' ' + result : '')}
        onClick={() => setArmed(true)}
        onBlur={() => { if (!solvedRef.current) setArmed(false); }}
      >
        {!armed && <span className="sc-prompt">Cliquez ici, puis tapez le raccourci</span>}
        {armed && held.length === 0 && !result && (
          <span className="sc-prompt sc-listening">À vous…</span>
        )}
        {(held.length > 0 || result) && (
          <span className="sc-keys">
            {(result === 'ok' ? spec.keys : held).map((k, i) => (
              <kbd key={k + i}>{label(k)}</kbd>
            ))}
          </span>
        )}
      </button>

      {result === 'ok' && (
        <p className="xl-feedback ok" role="status">
          Exact. {spec.display && <>Sur Windows : <kbd>{spec.display}</kbd>. </>}
          {spec.mac && <>Sur Mac : <kbd>{spec.mac}</kbd>.</>}
        </p>
      )}
      {result === 'ko' && (
        <p className="xl-feedback ko" role="status">
          Pas celui-là. Réessayez — le raccourci combine{' '}
          {spec.keys.length} touches.
        </p>
      )}

      <button
        type="button"
        className="xl-hintbtn"
        onClick={() => { setResult('ok'); solvedRef.current = true; onSolved?.(); }}
      >
        Je ne trouve pas, montrer la réponse
      </button>
    </div>
  );
}
