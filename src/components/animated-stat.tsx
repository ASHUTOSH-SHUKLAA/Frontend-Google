"use client";

import { useEffect, useRef, useState } from "react";

export function AnimatedStat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const target = useRef<HTMLSpanElement>(null);
  const [current, setCurrent] = useState(value);

  useEffect(() => {
    const element = target.current;
    if (!element) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const duration = 1000;
      const startedAt = performance.now();
      setCurrent(0);
      const tick = (now: number) => {
        const progress = Math.min((now - startedAt) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        setCurrent(Math.round(value * eased));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.55 });

    observer.observe(element);
    return () => observer.disconnect();
  }, [value]);

  return <b aria-label={`${value}${suffix} ${label}`}><span ref={target} aria-hidden="true">{current}</span><span aria-hidden="true">{suffix}</span></b>;
}
