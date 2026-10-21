'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Apparition au scroll : opacité + translation + léger flou.
 * Le contenu reste visible si le JS ne charge pas (classe ajoutée côté client),
 * et l'animation est désactivée si l'utilisateur a demandé moins de mouvement.
 */
export default function Reveal({ children, as: Tag = 'div', delay = 0, className = '', ...rest }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true);
      return;
    }
    setArmed(true);
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: '0px 0px -60px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const style = armed && !shown
    ? { opacity: 0, transform: 'translateY(28px)', filter: 'blur(4px)' }
    : {
        opacity: 1,
        transform: 'none',
        filter: 'none',
        transition: armed
          ? `opacity .65s cubic-bezier(.22,1,.36,1) ${delay}ms, transform .65s cubic-bezier(.22,1,.36,1) ${delay}ms, filter .65s cubic-bezier(.22,1,.36,1) ${delay}ms`
          : undefined,
      };

  return (
    <Tag ref={ref} className={className} style={style} {...rest}>
      {children}
    </Tag>
  );
}
