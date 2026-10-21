'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const F0 = 806;   // free cash flow de départ, en M€
const N = 5;      // années projetées

const fr = (n) =>
  Math.round(n).toLocaleString('fr-FR').replace(/ /g, ' ');

function computeDcf(growth, wacc, multiple) {
  const g = growth / 100;
  const w = wacc / 100;
  const pv = [];
  for (let t = 1; t <= N; t++) {
    pv.push((F0 * Math.pow(1 + g, t)) / Math.pow(1 + w, t));
  }
  const tv = (F0 * Math.pow(1 + g, N) * multiple) / Math.pow(1 + w, N);
  return { pv, tv, ev: pv.reduce((a, b) => a + b, 0) + tv };
}

/** Compteur qui interpole depuis la valeur précédente, jamais depuis zéro. */
function useCounter(target) {
  const [display, setDisplay] = useState(target);
  const from = useRef(target);
  const raf = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      from.current = target;
      setDisplay(target);
      return;
    }
    const start = performance.now();
    const origin = from.current;
    const tick = (now) => {
      const k = Math.min(1, (now - start) / 400);
      const eased = 1 - Math.pow(1 - k, 3);
      setDisplay(origin + (target - origin) * eased);
      if (k < 1) raf.current = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);

  return display;
}

export default function DcfDemo() {
  const [growth, setGrowth] = useState(8);
  const [wacc, setWacc] = useState(9);
  const [multiple, setMultiple] = useState(12);
  const [flash, setFlash] = useState(false);

  const d = useMemo(() => computeDcf(growth, wacc, multiple), [growth, wacc, multiple]);
  const ev = useCounter(d.ev);
  const tv = useCounter(d.tv);
  const previousEv = useRef(d.ev);

  useEffect(() => {
    if (Math.abs(d.ev - previousEv.current) / previousEv.current > 0.02) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 600);
      previousEv.current = d.ev;
      return () => clearTimeout(t);
    }
    previousEv.current = d.ev;
  }, [d.ev]);

  const W = 560, H = 220, PAD = 26;
  const values = [...d.pv, d.tv];
  const max = Math.max(...values) * 1.18;
  const slot = (W - PAD * 2) / values.length;
  const bw = slot - 16;

  return (
    <div className="demo">
      <div>
        <div className="ctrl">
          <label htmlFor="g">
            Croissance du FCF
            <output className="num">{growth.toFixed(1).replace('.', ',')} %</output>
          </label>
          <input id="g" type="range" min="0" max="15" step="0.5" value={growth}
            aria-label="Croissance annuelle du free cash flow"
            onChange={(e) => setGrowth(+e.target.value)} />
          <p className="hint">Au-delà de 10 %, vous faites une hypothèse que le marché devra confirmer.</p>
        </div>
        <div className="ctrl">
          <label htmlFor="w">
            WACC
            <output className="num">{wacc.toFixed(2).replace('.', ',')} %</output>
          </label>
          <input id="w" type="range" min="5" max="15" step="0.25" value={wacc}
            aria-label="Coût moyen pondéré du capital"
            onChange={(e) => setWacc(+e.target.value)} />
          <p className="hint">Le levier le plus sensible : un point de WACC vaut souvent 15 % de valorisation.</p>
        </div>
        <div className="ctrl">
          <label htmlFor="m">
            Exit multiple
            <output className="num">{multiple.toFixed(1).replace('.', ',')}×</output>
          </label>
          <input id="m" type="range" min="6" max="20" step="0.5" value={multiple}
            aria-label="Multiple de sortie appliqué au free cash flow de l'année 5"
            onChange={(e) => setMultiple(+e.target.value)} />
          <p className="hint">Applique un multiple au FCF de l&apos;année 5 pour obtenir la terminal value.</p>
        </div>
      </div>

      <div>
        <div className="readout">
          <div>
            <span className="k">Enterprise value</span>
            <span className={flash ? 'v flash' : 'v'}>{fr(ev)}</span>
          </div>
          <div>
            <span className="k">Terminal value</span>
            <span className="m">{fr(tv)}</span>
          </div>
          <div>
            <span className="k">Part du terminal</span>
            <span className="m">{Math.round((d.tv / d.ev) * 100)} %</span>
          </div>
        </div>

        <figure className="chartbox" style={{ margin: 0 }}>
          <figcaption>Flux actualisés, en M€</figcaption>
          <svg id="chart" viewBox={`0 0 ${W} ${H}`} role="img"
            aria-label="Flux de trésorerie actualisés par année et terminal value">
            <line x1={PAD} y1={H - 26} x2={W - PAD} y2={H - 26} stroke="#23262B" />
            {values.map((v, i) => {
              const x = PAD + i * slot + 8;
              const h = Math.max(2, (v / max) * (H - 64));
              const last = i === values.length - 1;
              return (
                <g key={i}>
                  <rect className="bar" x={x} y={H - 26 - h} width={bw} height={h} rx="4"
                    fill={last ? '#8B5CF6' : '#3A5BFF'} />
                  <text x={x + bw / 2} y={H - 36 - h} textAnchor="middle">{fr(v)}</text>
                  <text x={x + bw / 2} y={H - 9} textAnchor="middle">
                    {last ? 'TV' : `A${i + 1}`}
                  </text>
                </g>
              );
            })}
          </svg>
        </figure>
      </div>
    </div>
  );
}
