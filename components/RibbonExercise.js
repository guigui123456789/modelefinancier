'use client';

import { useState } from 'react';

/**
 * Entraînement au chemin dans le ruban.
 *
 * Représentation schématique : les noms d'onglets, de groupes et de commandes
 * sont ceux d'Excel, la mise en forme est la nôtre. L'objectif est de mémoriser
 * le chemin, pas de reconnaître des pixels.
 *
 * spec = {
 *   goal: "Ouvrir le gestionnaire de noms",
 *   tabs: ["Accueil", "Formules", …],
 *   groups: { "Formules": [ { name, items: [] } ] },
 *   answer: { tab: "Formules", item: "Gestionnaire de noms" },
 *   explanation: "…"
 * }
 */
export default function RibbonExercise({ spec, onSolved }) {
  const [tab, setTab] = useState(spec.start ?? spec.tabs[0]);
  const [picked, setPicked] = useState(null);
  const [tries, setTries] = useState(0);

  if (!spec?.tabs?.length) return null;

  const groups = spec.groups?.[tab] ?? [];
  const solved = picked?.correct;

  function choose(item) {
    if (solved) return;
    const correct = tab === spec.answer.tab && item === spec.answer.item;
    setPicked({ tab, item, correct });
    setTries((n) => n + 1);
    if (correct) onSolved?.();
  }

  return (
    <div className="ribbon-exo">
      <p className="ribbon-goal">
        <span className="ribbon-goal-k">Objectif</span>
        {spec.goal}
      </p>

      <div className="ribbon">
        <div className="ribbon-tabs" role="tablist">
          {spec.tabs.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={t === tab}
              className="ribbon-tab"
              onClick={() => { if (!solved) { setTab(t); setPicked(null); } }}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="ribbon-body">
          {groups.length === 0 ? (
            <p className="ribbon-empty">
              Cet onglet existe, mais la commande recherchée n&apos;y est pas.
            </p>
          ) : (
            groups.map((g) => (
              <div className="ribbon-group" key={g.name}>
                <div className="ribbon-items">
                  {g.items.map((it) => {
                    const isPicked = picked?.tab === tab && picked?.item === it;
                    const isAnswer =
                      picked && tab === spec.answer.tab && it === spec.answer.item;
                    const cls =
                      'ribbon-item' +
                      (isPicked && picked.correct ? ' right' : '') +
                      (isPicked && !picked.correct ? ' wrong' : '') +
                      (!isPicked && isAnswer && picked && !picked.correct ? ' reveal' : '');
                    return (
                      <button
                        key={it}
                        type="button"
                        className={cls}
                        disabled={solved}
                        onClick={() => choose(it)}
                      >
                        {it}
                      </button>
                    );
                  })}
                </div>
                <span className="ribbon-gname">{g.name}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {picked && (
        <p className={'xl-feedback ' + (picked.correct ? 'ok' : 'ko')} role="status">
          {picked.correct
            ? `Exact : ${spec.answer.tab} → ${spec.answer.item}.`
            : tries >= 2
              ? `Pas ici. Le chemin est ${spec.answer.tab} → ${spec.answer.item}.`
              : 'Pas ici. Regardez dans un autre onglet, ou un autre groupe.'}
        </p>
      )}
    </div>
  );
}
