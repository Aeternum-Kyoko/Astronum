"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useDragControls, useMotionValue, useTransform, type PanInfo } from "motion/react";
import { haptic } from "@/lib/haptics";

/**
 * A native-feeling bottom sheet: springs up from the tab bar, drags down to
 * dismiss, closes on Escape or a tap outside, and keeps focus inside while open.
 */
export default function BottomSheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  const drag = useDragControls();
  // As the sheet is pulled down, its top corners round out and it narrows a touch — a liquid give.
  const dragY = useMotionValue(0); // how far the sheet is pulled down, fed from onDrag
  const radius = useTransform(dragY, [0, 260], [32, 56]);
  const squeeze = useTransform(dragY, [0, 260], [1, 0.965]);

  useEffect(() => {
    if (!open) return;
    haptic("light");
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const prevFocus = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panel.current) {
        const items = panel.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input, select, [tabindex='0']");
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      prevFocus?.focus?.();
    };
  }, [open, onClose]);

  function onDragEnd(_: unknown, info: PanInfo) {
    dragY.set(0);
    if (info.offset.y > 120 || info.velocity.y > 600) {
      haptic("light");
      onClose();
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            className="glass glass-sheet absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-hidden pb-[env(safe-area-inset-bottom)] outline-none"
            style={{ borderTopLeftRadius: radius, borderTopRightRadius: radius, scaleX: squeeze }}
            onDrag={(_, info) => dragY.set(Math.max(0, info.offset.y))}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            drag="y"
            dragListener={false}
            dragControls={drag}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={onDragEnd}
          >
            <div className="flex cursor-grab touch-none justify-center pt-3 pb-2 active:cursor-grabbing" onPointerDown={(e) => drag.start(e)}>
              <span className="h-1.5 w-10 rounded-full bg-border" aria-hidden="true" />
            </div>
            <div className="max-h-[calc(88dvh-2.5rem)] overflow-y-auto overscroll-contain px-5 pb-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
