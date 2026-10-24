"use client";

import { useRef, type ReactNode } from "react";

/** The instrument tilts without changing calculated longitudes or planet selection. */
export default function CinematicSkyStage({ children }: { children: ReactNode }) {
  const stage = useRef<HTMLDivElement>(null);
  return <div className="home-observatory-dial" ref={stage} onPointerMove={event => {
    if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    event.currentTarget.style.setProperty("--sky-tilt-x", `${-y * 7}deg`);
    event.currentTarget.style.setProperty("--sky-tilt-y", `${x * 7}deg`);
  }} onPointerLeave={() => {
    stage.current?.style.setProperty("--sky-tilt-x", "0deg");
    stage.current?.style.setProperty("--sky-tilt-y", "0deg");
  }}>
    <div className="home-orbital-scene" aria-hidden="true"><div className="home-orbit home-orbit-outer" /><div className="home-orbit home-orbit-inner" /><div className="home-orbit-moon" /></div>
    <div className="home-floating-instrument">{children}</div>
  </div>;
}
