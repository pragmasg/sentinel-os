"use client";

import { useEffect, useMemo, useState } from "react";

type CommandBarProps = {
  open: boolean;
  onClose: () => void;
  onCommand: (cmd: string) => void;
};

export default function GlobalCommandBar(props: CommandBarProps) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!props.open) setValue("");
  }, [props.open]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && props.open) props.onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [props]);

  const hints = useMemo(
    () => [
      "> research [query]",
      "> log [symbol]",
      "> stress [sector] [-0.10]",
    ],
    [],
  );

  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm" onMouseDown={props.onClose}>
      <div
        className="mx-auto mt-24 w-full max-w-2xl rounded-2xl border border-white/10 bg-neutral-950 p-4"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="text-xs text-white/50">Global Command Bar</div>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              props.onCommand(value);
              props.onClose();
            }
          }}
          placeholder="> command"
          className="mt-2 w-full rounded-md bg-black border border-white/10 px-3 py-2 outline-none focus:border-[var(--accent-green)]"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {hints.map((h) => (
            <div key={h} className="text-[11px] text-white/40 border border-white/10 rounded-md px-2 py-1">
              {h}
            </div>
          ))}
        </div>
        <div className="mt-3 text-[11px] text-white/40">
          Pragmas OS is an analytics tool. No execution. No advice.
        </div>
      </div>
    </div>
  );
}
