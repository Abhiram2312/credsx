import { useLayoutEffect, useRef, useState } from "react";
import type { CreditCard } from "./cardStore";
import { bladeSize, skinIndex } from "./orbitMath";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

const CYCLE_MS = 36000;

type Props = {
  cards: CreditCard[];
  onOpen: (id: string) => void;
  onAdd: () => void;
};

export function Orbit({ cards, onOpen, onAdd }: Props) {
  const stageRef = useRef<HTMLElement>(null);
  const rotorRef = useRef<HTMLDivElement>(null);
  const angleRef = useRef(0);
  const reduced = usePrefersReducedMotion();
  const reducedRef = useRef(false);
  const [size, setSize] = useState({ width: 860, height: 560 });

  useLayoutEffect(() => {
    reducedRef.current = reduced;
  }, [reduced]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const apply = () => setSize({ width: stage.clientWidth || 860, height: stage.clientHeight || 560 });
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const delta = Math.min(34, now - last);
      last = now;
      if (!reducedRef.current && document.visibilityState === "visible") {
        angleRef.current = (angleRef.current + (delta * 360) / CYCLE_MS) % 360;
      }
      const rotor = rotorRef.current;
      if (rotor) rotor.style.transform = `rotate(${angleRef.current}deg)`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const { width, hub } = bladeSize(size.width, size.height);
  const count = Math.max(cards.length, 1);

  return (
    <nav
      ref={stageRef}
      className="orbit-stage"
      aria-label="Card pages"
      style={{ ["--blade" as string]: `${width}px`, ["--hub" as string]: `${hub * 2}px` }}
    >
      <div ref={rotorRef} className="orbit-rotor">
        {cards.map((card, index) => (
          <button
            key={card.id}
            type="button"
            className="orbit-face"
            data-skin={skinIndex(index)}
            aria-label={`${card.nickname} card`}
            style={{
              transform: `translate(-50%, -50%) rotate(${-90 + (index * 360) / count}deg) translateX(${hub + width / 2}px)`,
            }}
            onClick={() => onOpen(card.id)}
          >
            <span className="orbit-mark" aria-hidden />
            <strong>{card.nickname}</strong>
          </button>
        ))}
      </div>
      <button type="button" className="orbit-add-hub" aria-label="Add a card" onClick={onAdd}>
        <span aria-hidden>+</span>
      </button>
    </nav>
  );
}
