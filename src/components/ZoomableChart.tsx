"use client";

import { useRef, useState } from "react";
import { haptic } from "@/lib/haptics";

interface View {
  scale: number;
  x: number;
  y: number;
}

const MAX = 3;

/**
 * Pinch to zoom a chart (1–3×), drag to pan while zoomed, double-tap to zoom
 * in or back out. Unzoomed, vertical page scrolling and taps on planets and
 * houses work as normal.
 */
export default function ZoomableChart({ children }: { children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>({ scale: 1, x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ dist: number; mid: { x: number; y: number }; start: View } | null>(null);
  const pan = useRef<{ x: number; y: number; start: View } | null>(null);
  const lastTap = useRef(0);
  const [dragging, setDragging] = useState(false);

  const clamp = (v: View): View => {
    const el = box.current;
    if (!el) return v;
    const w = el.clientWidth;
    const h = el.clientHeight;
    const scale = Math.min(MAX, Math.max(1, v.scale));
    return { scale, x: Math.min(0, Math.max(w - w * scale, v.x)), y: Math.min(0, Math.max(h - h * scale, v.y)) };
  };
  const local = (e: { clientX: number; clientY: number }) => {
    const r = box.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === "mouse") return;
    pointers.current.set(e.pointerId, local(e));
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, start: view };
      pan.current = null;
      setDragging(true);
    } else if (view.scale > 1) {
      pan.current = { ...local(e), start: view };
      setDragging(true);
    }
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, local(e));
    if (gesture.current && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const g = gesture.current;
      const scale = Math.min(MAX, Math.max(1, g.start.scale * (Math.hypot(a.x - b.x, a.y - b.y) / g.dist)));
      const k = scale / g.start.scale;
      // Keep the point between the fingers fixed while zooming.
      setView(clamp({ scale, x: g.mid.x - (g.mid.x - g.start.x) * k, y: g.mid.y - (g.mid.y - g.start.y) * k }));
    } else if (pan.current) {
      const p = local(e);
      setView(clamp({ ...pan.current.start, x: pan.current.start.x + p.x - pan.current.x, y: pan.current.start.y + p.y - pan.current.y }));
    }
  }
  function onPointerUp(e: React.PointerEvent) {
    const wasPinch = !!gesture.current;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2 && gesture.current) {
      gesture.current = null;
      haptic("selection");
    }
    if (!pointers.current.size) {
      pan.current = null;
      setDragging(false);
    }
    if (wasPinch || e.pointerType === "mouse") return;
    // Double-tap on the chart (not on a planet) zooms in there, or back out.
    const now = Date.now();
    if (now - lastTap.current < 280 && !(e.target as Element).closest("[role=button]")) {
      const p = local(e);
      setView(view.scale > 1 ? { scale: 1, x: 0, y: 0 } : clamp({ scale: 2, x: p.x - p.x * 2, y: p.y - p.y * 2 }));
      haptic("light");
      lastTap.current = 0;
    } else lastTap.current = now;
  }

  const zoomed = view.scale > 1.01;
  return (
    <div className="relative">
      <div
        ref={box}
        className="overflow-hidden rounded-xl"
        style={{ touchAction: zoomed ? "none" : "pan-y" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        data-no-swipe={zoomed ? "" : undefined}
      >
        <div style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`, transformOrigin: "0 0", transition: dragging ? "none" : "transform 180ms ease-out" }}>{children}</div>
      </div>
      {zoomed && (
        <button type="button" onClick={() => setView({ scale: 1, x: 0, y: 0 })} className="glass absolute top-2 right-2 rounded-full px-3 py-1 text-xs font-semibold text-cream">
          Reset zoom
        </button>
      )}
    </div>
  );
}
