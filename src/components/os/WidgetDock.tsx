"use client";

import { WidgetRegistry } from "@/src/components/os/registry";

export default function WidgetDock(props: {
  activeWidgetIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999]">
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/80 backdrop-blur px-3 py-2">
        {Object.values(WidgetRegistry).map((w) => {
          const active = props.activeWidgetIds.includes(w.id);
          return (
            <button
              key={w.id}
              onClick={() => props.onToggle(w.id)}
              className={
                "rounded-xl px-3 py-2 text-xs border transition " +
                (active
                  ? "border-[var(--accent-green)]/60 text-[var(--accent-green)]"
                  : "border-white/10 text-white/70 hover:border-white/30")
              }
              aria-pressed={active}
              title={w.title}
            >
              {w.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}
