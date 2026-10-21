'use client';

import { useState } from 'react';
import Link from 'next/link';

const LEVEL_LABEL = {
  fundamentals: 'Fund.',
  practitioner: 'Pract.',
  advanced: 'Adv.',
};

const TRACK_IMAGE = {
  'valuation-analyst': '/img/hero2.jpg',
  ma: '/img/team.jpg',
  'private-equity': '/img/hero3.jpg',
  cfo: '/img/board.jpg',
};

export default function TrackTabs({ tracks }) {
  const [active, setActive] = useState(0);
  const [fading, setFading] = useState(false);

  if (!tracks?.length) return null;

  const select = (i, focus) => {
    if (i === active) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setActive(i);
    } else {
      setFading(true);
      setTimeout(() => {
        setActive(i);
        setFading(false);
      }, 150);
    }
    if (focus) {
      document.getElementById(`tab-${i}`)?.focus();
    }
  };

  const track = tracks[active];
  const hours = Math.round(
    track.lessons.reduce((sum, l) => sum + (l.duration_min || 0), 0) / 60
  );

  return (
    <div>
      <div className="tabs" role="tablist">
        {tracks.map((t, i) => (
          <button
            key={t.slug}
            id={`tab-${i}`}
            type="button"
            role="tab"
            className="tab"
            aria-selected={i === active}
            tabIndex={i === active ? 0 : -1}
            onClick={() => select(i)}
            onKeyDown={(e) => {
              if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
              e.preventDefault();
              const next =
                (i + (e.key === 'ArrowRight' ? 1 : tracks.length - 1)) % tracks.length;
              select(next, true);
            }}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div className={fading ? 'panel fade' : 'panel'}>
        <ol className="lessons">
          {track.lessons.map((l) => (
            <li key={l.slug}>
              <Link className="t" href={`/modeles/${l.slug}`}>{l.title}</Link>
              <span className="lv">{LEVEL_LABEL[l.level] ?? l.level}</span>
            </li>
          ))}
        </ol>

        <aside className="aside">
          <img src={TRACK_IMAGE[track.slug] ?? '/img/hero1.jpg'} alt="" />
          <div className="pad">
            <h3>{track.name}</h3>
            <p>{track.description}</p>
            <dl>
              <dt>Leçons</dt>
              <dd>{track.lessons.length}</dd>
              <dt>Durée</dt>
              <dd>{hours} h</dd>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
