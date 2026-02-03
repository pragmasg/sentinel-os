"use client";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GridLayout, { type Layout } from "react-grid-layout";

import WidgetDock from "@/src/components/os/WidgetDock";
import GlobalCommandBar from "@/src/components/os/GlobalCommandBar";
import { registryById, WidgetRegistry } from "@/src/components/os/registry";
import { saveCanvasLayout, type CanvasLayoutPayload } from "@/src/actions/user-config";
import { useOSBus } from "@/src/state/os-bus";

type CanvasState = {
  version: 1;
  activeWidgetIds: string[];
  layout: Layout;
  focusedWidgetId?: string | null;
};

function defaultCanvasState(): CanvasState {
  const initial = [WidgetRegistry.PORTFOLIO_SUMMARY.id, WidgetRegistry.RISK_STRESS_TEST.id];
  const layout: Layout = [
    {
      i: WidgetRegistry.PORTFOLIO_SUMMARY.id,
      x: 0,
      y: 0,
      w: WidgetRegistry.PORTFOLIO_SUMMARY.defaultSize.w,
      h: WidgetRegistry.PORTFOLIO_SUMMARY.defaultSize.h,
      minW: WidgetRegistry.PORTFOLIO_SUMMARY.minSize?.w,
      minH: WidgetRegistry.PORTFOLIO_SUMMARY.minSize?.h,
    },
    {
      i: WidgetRegistry.RISK_STRESS_TEST.id,
      x: 6,
      y: 0,
      w: WidgetRegistry.RISK_STRESS_TEST.defaultSize.w,
      h: WidgetRegistry.RISK_STRESS_TEST.defaultSize.h,
      minW: WidgetRegistry.RISK_STRESS_TEST.minSize?.w,
      minH: WidgetRegistry.RISK_STRESS_TEST.minSize?.h,
    },
  ];
  return { version: 1, activeWidgetIds: initial, layout, focusedWidgetId: initial[0] };
}

function isCanvasState(value: any): value is CanvasState {
  return value && value.version === 1 && Array.isArray(value.activeWidgetIds) && Array.isArray(value.layout);
}

export default function CommandSurface() {
  const [canvas, setCanvas] = useState<CanvasState>(() => defaultCanvasState());
  const [commandOpen, setCommandOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const gridRef = useRef<HTMLDivElement | null>(null);
  const [gridWidth, setGridWidth] = useState(1100);

  const debouncedSaveTimer = useRef<number | null>(null);
  const focusSeq = useRef(1);
  const [zMap, setZMap] = useState<Record<string, number>>({});

  const requestLogSymbol = useOSBus((s) => s.logSymbol);
  const clearRequestLog = useOSBus((s) => s.requestLog);

  const activeLayout = useMemo(() => {
    const ids = new Set(canvas.activeWidgetIds);
    return canvas.layout.filter((l) => ids.has(l.i));
  }, [canvas]);

  const scheduleSave = useCallback(
    (next: CanvasState) => {
      if (debouncedSaveTimer.current) {
        window.clearTimeout(debouncedSaveTimer.current);
      }

      debouncedSaveTimer.current = window.setTimeout(async () => {
        setSaving(true);
        setSaveError(null);
        try {
          const payload: CanvasLayoutPayload = {
            version: 1,
            activeWidgetIds: next.activeWidgetIds,
            layout: next.layout,
            focusedWidgetId: next.focusedWidgetId ?? null,
          };

          const res = await saveCanvasLayout(payload);
          if (!res.ok) throw new Error(res.error ?? "Failed to save layout");
        } catch (e) {
          setSaveError(e instanceof Error ? e.message : "Failed to save layout");
        } finally {
          setSaving(false);
        }
      }, 2000);
    },
    [setSaving],
  );

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/user/config", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json().catch(() => null);
      const layout = json?.canvasLayout;
      if (isCanvasState(layout)) {
        setCanvas(layout);
      }
    }

    load();
  }, []);

  useEffect(() => {
    if (!gridRef.current) return;
    const el = gridRef.current;

    const ro = new ResizeObserver(() => {
      const w = el.getBoundingClientRect().width;
      if (Number.isFinite(w) && w > 0) setGridWidth(Math.floor(w));
    });

    ro.observe(el);
    const w = el.getBoundingClientRect().width;
    if (Number.isFinite(w) && w > 0) setGridWidth(Math.floor(w));

    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    // If another widget requests a log modal, ensure portfolio widget is open and focused.
    if (!requestLogSymbol) return;
    openWidget(WidgetRegistry.PORTFOLIO_SUMMARY.id);
    focusWidget(WidgetRegistry.PORTFOLIO_SUMMARY.id);
    clearRequestLog(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestLogSymbol]);

  const focusWidget = useCallback((id: string) => {
    focusSeq.current += 1;
    setZMap((m) => ({ ...m, [id]: focusSeq.current }));
    setCanvas((c) => ({ ...c, focusedWidgetId: id }));
  }, []);

  const openWidget = useCallback(
    (id: string) => {
      const def = registryById(id);
      if (!def) return;

      setCanvas((c) => {
        if (c.activeWidgetIds.includes(id)) return c;

        const nextLayout: Layout = [
          ...c.layout,
          {
            i: id,
            x: 0,
            y: Infinity,
            w: def.defaultSize.w,
            h: def.defaultSize.h,
            minW: def.minSize?.w,
            minH: def.minSize?.h,
          },
        ];

        const next: CanvasState = {
          ...c,
          activeWidgetIds: [...c.activeWidgetIds, id],
          layout: nextLayout,
          focusedWidgetId: id,
        };

        scheduleSave(next);
        return next;
      });

      focusWidget(id);
    },
    [focusWidget, scheduleSave],
  );

  const closeWidget = useCallback(
    (id: string) => {
      setCanvas((c) => {
        if (!c.activeWidgetIds.includes(id)) return c;

        const next: CanvasState = {
          ...c,
          activeWidgetIds: c.activeWidgetIds.filter((w) => w !== id),
          layout: c.layout.filter((l) => l.i !== id),
          focusedWidgetId: c.focusedWidgetId === id ? null : c.focusedWidgetId,
        };

        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

  const toggleWidget = useCallback(
    (id: string) => {
      if (canvas.activeWidgetIds.includes(id)) closeWidget(id);
      else openWidget(id);
    },
    [canvas.activeWidgetIds, closeWidget, openWidget],
  );

  const onLayoutChange = useCallback(
    (layout: Layout) => {
      setCanvas((c) => {
        const next: CanvasState = { ...c, layout };
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

  const onCommand = useCallback(
    (raw: string) => {
      const text = raw.trim().replace(/^>\s*/, "");
      const [cmd, ...rest] = text.split(" ");
      const arg = rest.join(" ").trim();

      if (cmd === "research") {
        openWidget(WidgetRegistry.RESEARCH_VAULT.id);
        useOSBus.getState().setResearchQuery(arg || "");
        return;
      }

      if (cmd === "log") {
        openWidget(WidgetRegistry.PORTFOLIO_SUMMARY.id);
        focusWidget(WidgetRegistry.PORTFOLIO_SUMMARY.id);
        useOSBus.getState().requestLog(arg || null);
        return;
      }

      if (cmd === "stress") {
        openWidget(WidgetRegistry.RISK_STRESS_TEST.id);
        const parts = arg.split(" ").filter(Boolean);
        const sector = parts[0] ?? "Unknown";
        const shockPct = parts[1] ? Number(parts[1]) : -0.1;
        useOSBus.getState().setStressScenario({ sector, shockPct: Number.isFinite(shockPct) ? shockPct : -0.1 });
        return;
      }
    },
    [focusWidget, openWidget],
  );

  return (
    <div className="relative min-h-screen w-full">
      <div className="px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-white/50">Pragmas OS</div>
            <div className="text-xl font-semibold tracking-tight">Command Surface</div>
            <div className="mt-1 text-xs text-white/50">Ctrl+K • draggable widgets • post-trade logging only</div>
          </div>
          <div className="text-xs text-white/50">
            {saving ? "Saving…" : saveError ? `Save error: ${saveError}` : "Saved"}
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-neutral-950 p-2">
          <div ref={gridRef} className="w-full">
            <GridLayout
              className="layout"
              layout={activeLayout}
              width={gridWidth}
              gridConfig={{ cols: 12, rowHeight: 42, margin: [10, 10] }}
              dragConfig={{ bounded: true, handle: ".os-widget-handle" }}
              onLayoutChange={onLayoutChange}
            >
              {canvas.activeWidgetIds.map((id) => {
                const def = registryById(id);
                if (!def) return null;
                const Comp = def.component;
                const z = zMap[id] ?? 1;

                return (
                  <div key={id} style={{ zIndex: z }}>
                    <div
                      className={
                        "h-full rounded-xl border bg-black p-3 " +
                        (canvas.focusedWidgetId === id
                          ? "border-[var(--accent-green)]/40"
                          : "border-white/10")
                      }
                      onMouseDown={() => focusWidget(id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="os-widget-handle cursor-move text-xs text-white/70">
                          {def.title}
                        </div>
                        <button
                          onClick={() => closeWidget(id)}
                          className="text-xs text-white/40 hover:text-white"
                          aria-label={`Close ${def.title}`}
                        >
                          ×
                        </button>
                      </div>
                      <div className="mt-3 h-[calc(100%-28px)] overflow-auto">
                        <Comp />
                      </div>
                    </div>
                  </div>
                );
              })}
            </GridLayout>
          </div>
        </div>
      </div>

      <WidgetDock activeWidgetIds={canvas.activeWidgetIds} onToggle={toggleWidget} />

      <GlobalCommandBar open={commandOpen} onClose={() => setCommandOpen(false)} onCommand={onCommand} />
    </div>
  );
}
