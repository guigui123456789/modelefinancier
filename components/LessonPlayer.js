'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ExcelExercise from './ExcelExercise';
import { recordAnswer, completeLesson } from '@/app/excel-actions';

const KIND_LABEL = {
  concept: 'Notion',
  example: 'Exemple',
  check: 'Contrôle',
  build: 'À vous',
  recap: 'Récapitulatif',
};

export default function LessonPlayer({ lessonId, lessonTitle, steps, nextLesson, signedIn }) {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState({});   // stepId -> { value, correct }
  const [done, setDone] = useState(false);

  const step = steps[i];
  const last = i === steps.length - 1;
  const answered = step ? answers[step.id] : null;

  // Un écran de contrôle doit être résolu avant de passer au suivant.
  const blocked = step && (step.kind === 'check' || step.kind === 'build') && !answered;

  const go = useCallback((delta) => {
    setI((prev) => Math.min(steps.length - 1, Math.max(0, prev + delta)));
  }, [steps.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' && !blocked && !last) go(1);
      if (e.key === 'ArrowLeft' && i > 0) go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, blocked, last, i]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [i]);

  function answerMcq(optionId) {
    if (answered) return;
    const correct = optionId === step.correct;
    setAnswers((a) => ({ ...a, [step.id]: { value: optionId, correct } }));
    if (signedIn) recordAnswer(step.id, correct);
  }

  function answerNumeric(e) {
    e.preventDefault();
    if (answered) return;
    const raw = new FormData(e.currentTarget).get('n');
    const n = parseFloat(String(raw).replace(/\s/g, '').replace(',', '.'));
    const target = parseFloat(step.correct);
    const tol = step.tolerance ?? Math.abs(target) * 0.01;
    const correct = Number.isFinite(n) && Math.abs(n - target) <= tol;
    setAnswers((a) => ({ ...a, [step.id]: { value: n, correct } }));
    if (signedIn) recordAnswer(step.id, correct);
  }

  async function finish() {
    setDone(true);
    if (signedIn) await completeLesson(lessonId);
  }

  if (!step) return null;

  const correctCount = Object.values(answers).filter((a) => a.correct).length;
  const checkCount = steps.filter((s) => s.kind === 'check' || s.kind === 'build').length;

  return (
    <div className="player">
      <div className="player-top">
        <Link className="player-back" href="/modeles">← Quitter</Link>
        <div className="player-bar" aria-hidden="true">
          {steps.map((s, k) => (
            <span
              key={s.id}
              className={
                'seg' +
                (k < i ? ' past' : '') +
                (k === i ? ' now' : '') +
                (answers[s.id] ? (answers[s.id].correct ? ' good' : ' bad') : '')
              }
            />
          ))}
        </div>
        <span className="player-count">{i + 1} / {steps.length}</span>
      </div>

      <article className="player-card">
        <span className={'kind kind-' + step.kind}>{KIND_LABEL[step.kind] ?? step.kind}</span>
        <h2>{step.title}</h2>

        {step.bodyHtml && (
          <div className="prose" dangerouslySetInnerHTML={{ __html: step.bodyHtml }} />
        )}

        {step.kind === 'check' && step.options && (
          <ul className="options">
            {step.options.map((o) => {
              const picked = answered?.value === o.id;
              const isRight = o.id === step.correct;
              const cls = !answered ? '' : isRight ? ' right' : picked ? ' wrong' : ' dim';
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    className={'option' + cls}
                    disabled={!!answered}
                    onClick={() => answerMcq(o.id)}
                  >
                    <span className="opt-key">{o.id.toUpperCase()}</span>
                    <span>{o.text}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {step.kind === 'check' && !step.options && (
          <form className="numeric" onSubmit={answerNumeric}>
            <input
              name="n"
              inputMode="decimal"
              autoComplete="off"
              placeholder="Votre réponse"
              aria-label="Votre réponse"
              disabled={!!answered}
            />
            {step.unit && <span className="unit">{step.unit}</span>}
            <button className="btn btn-w btn-sm" type="submit" disabled={!!answered}>
              Valider
            </button>
          </form>
        )}

        {step.kind === 'build' && step.exercise && (
          <ExcelExercise
            stepId={step.id}
            display={step.exercise.display}
            cells={step.exercise.cells}
            target={step.exercise.target}
            hint={step.hint}
            onSolved={() => setAnswers((a) => ({ ...a, [step.id]: { correct: true } }))}
          />
        )}

        {step.kind === 'build' && !step.exercise && step.formula && (
          <>
            <pre className="formula">{step.formula}</pre>
            {step.hint && <p className="aside">{step.hint}</p>}
            <button
              type="button"
              className="btn btn-o btn-sm"
              onClick={() => setAnswers((a) => ({ ...a, [step.id]: { correct: true } }))}
            >
              J&apos;ai fait l&apos;exercice
            </button>
          </>
        )}

        {answered && step.explanationHtml && (
          <div
            className={'explain ' + (answered.correct ? 'ok' : 'ko')}
            dangerouslySetInnerHTML={{ __html: step.explanationHtml }}
          />
        )}

        {step.asideHtml && !answered && (
          <div className="aside-box" dangerouslySetInnerHTML={{ __html: step.asideHtml }} />
        )}
      </article>

      <div className="player-nav">
        <button className="btn btn-o" type="button" onClick={() => go(-1)} disabled={i === 0}>
          Précédent
        </button>
        {last ? (
          done ? (
            nextLesson ? (
              <Link className="btn btn-w" href={`/modeles/${nextLesson.slug}`}>
                Leçon suivante : {nextLesson.title}
              </Link>
            ) : (
              <Link className="btn btn-w" href="/modeles">Retour au catalogue</Link>
            )
          ) : (
            <button className="btn btn-w" type="button" onClick={finish} disabled={blocked}>
              Terminer la leçon
            </button>
          )
        ) : (
          <button className="btn btn-w" type="button" onClick={() => go(1)} disabled={blocked}>
            Suivant
          </button>
        )}
      </div>

      {blocked && (
        <p className="player-note">
          Répondez pour continuer. Une réponse fausse ne bloque pas : l&apos;explication s&apos;affiche et vous avancez.
        </p>
      )}

      {done && (
        <div className="player-done">
          <h3>Leçon terminée</h3>
          <p>
            {checkCount > 0
              ? `${correctCount} bonne${correctCount > 1 ? 's' : ''} réponse${correctCount > 1 ? 's' : ''} sur ${checkCount} contrôles.`
              : 'Progression enregistrée.'}
            {!signedIn && ' Créez un compte pour conserver votre progression.'}
          </p>
        </div>
      )}
    </div>
  );
}
