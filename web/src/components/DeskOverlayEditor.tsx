"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type DeskOverlay = {
  id: string;
  label: string;
  enabled: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
};

type Props = {
  layoutId: string;
  baseSrc: string;
  initialDesks: DeskOverlay[];
};

type DragMode =
  | { kind: "none" }
  | { kind: "move"; deskId: string; startX: number; startY: number; startDesk: DeskOverlay }
  | {
      kind: "resize";
      deskId: string;
      corner: "nw" | "ne" | "sw" | "se";
      startX: number;
      startY: number;
      startDesk: DeskOverlay;
    };

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function normalizeRect(rect: { x: number; y: number; width: number; height: number }) {
  const minSize = 0.01;

  let width = clamp01(rect.width);
  let height = clamp01(rect.height);
  width = Math.max(width, minSize);
  height = Math.max(height, minSize);

  let x = clamp01(rect.x);
  let y = clamp01(rect.y);

  // Ensure the rect stays fully in bounds.
  if (x + width > 1) width = Math.max(minSize, 1 - x);
  if (y + height > 1) height = Math.max(minSize, 1 - y);

  // If width/height were forced to minSize and don't fit, shift position.
  x = clamp(x, 0, 1 - width);
  y = clamp(y, 0, 1 - height);

  return { x, y, width, height };
}

function round4(n: number) {
  return Math.round(n * 10000) / 10000;
}

function toNormalizedAbs(px: number, sizePx: number) {
  if (sizePx <= 0) return 0;
  return clamp01(px / sizePx);
}

function toNormalizedDelta(deltaPx: number, sizePx: number) {
  if (sizePx <= 0) return 0;
  return deltaPx / sizePx;
}

function toPx(norm: number, sizePx: number) {
  return norm * sizePx;
}

function getPointerPos(e: React.PointerEvent, bounds: DOMRect) {
  return {
    x: e.clientX - bounds.left,
    y: e.clientY - bounds.top,
  };
}

async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed (${res.status})`);
  }

  return (await res.json()) as T;
}

export function DeskOverlayEditor({
  layoutId,
  baseSrc,
  initialDesks,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const desksRef = useRef<DeskOverlay[]>(initialDesks);

  const rafRef = useRef<number | null>(null);
  const pendingPointRef = useRef<{ x: number; y: number } | null>(null);

  const [desks, setDesks] = useState<DeskOverlay[]>(initialDesks);
  const [savedById, setSavedById] = useState<Record<string, DeskOverlay>>(() => {
    const entries = initialDesks.map((d) => [d.id, d] as const);
    return Object.fromEntries(entries);
  });
  const [selectedDeskId, setSelectedDeskId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragMode>({ kind: "none" });
  const [isSaving, setIsSaving] = useState(false);

  const selectedDesk = useMemo(
    () => desks.find((d) => d.id === selectedDeskId) ?? null,
    [desks, selectedDeskId],
  );

  useEffect(() => {
    desksRef.current = desks;
  }, [desks]);

  function approxEqual(a: number, b: number, eps = 0.0001) {
    return Math.abs(a - b) <= eps;
  }

  function isDeskDirty(d: DeskOverlay) {
    const saved = savedById[d.id];
    if (!saved) return false;
    if (d.label !== saved.label) return true;
    if (d.enabled !== saved.enabled) return true;
    if (!approxEqual(d.x, saved.x)) return true;
    if (!approxEqual(d.y, saved.y)) return true;
    if (!approxEqual(d.width, saved.width)) return true;
    if (!approxEqual(d.height, saved.height)) return true;
    return false;
  }

  const hasUnsavedChanges = useMemo(() => desks.some((d) => isDeskDirty(d)), [desks, savedById]);

  useEffect(() => {
    // Warn on full page unload (refresh/close). Note: SPA navigation may not trigger this.
    const handler = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  function getBounds() {
    const el = containerRef.current;
    if (!el) return null;
    return el.getBoundingClientRect();
  }

  async function createDeskAt(normX: number, normY: number) {
    setStatus(null);

    const width = 0.045;
    const height = 0.035;
    const rect = normalizeRect({
      x: normX - width / 2,
      y: normY - height / 2,
      width,
      height,
    });

    const created = await apiPost<{ desk: DeskOverlay }>("/api/admin/desks/create", {
      layoutId,
      label: `Desk ${desks.length + 1}`,
      x: round4(rect.x),
      y: round4(rect.y),
      width: round4(rect.width),
      height: round4(rect.height),
    });

    setDesks((prev) => [created.desk, ...prev]);
    setSavedById((prev) => ({ ...prev, [created.desk.id]: created.desk }));
    setSelectedDeskId(created.desk.id);
  }

  async function saveDesk(next: DeskOverlay) {
    setStatus(null);

    if (!next.label.trim()) {
      setStatus("Label cannot be empty.");
      return;
    }

    setIsSaving(true);

    const rect = normalizeRect({
      x: next.x,
      y: next.y,
      width: next.width,
      height: next.height,
    });

    try {
      const updated = await apiPost<{ desk: DeskOverlay }>("/api/admin/desks/update", {
        deskId: next.id,
        label: next.label,
        enabled: next.enabled,
        x: round4(rect.x),
        y: round4(rect.y),
        width: round4(rect.width),
        height: round4(rect.height),
      });

      setDesks((prev) => prev.map((d) => (d.id === updated.desk.id ? updated.desk : d)));
      setSavedById((prev) => ({ ...prev, [updated.desk.id]: updated.desk }));
      setStatus("Saved.");
    } finally {
      setIsSaving(false);
    }
  }

  async function disableDesk(deskId: string) {
    setStatus(null);
    const updated = await apiPost<{ desk: DeskOverlay }>("/api/admin/desks/disable", { deskId });
    setDesks((prev) => prev.map((d) => (d.id === deskId ? updated.desk : d)));
    setSavedById((prev) => ({ ...prev, [deskId]: updated.desk }));
  }

  async function enableDesk(deskId: string) {
    setStatus(null);
    const updated = await apiPost<{ desk: DeskOverlay }>("/api/admin/desks/enable", { deskId });
    setDesks((prev) => prev.map((d) => (d.id === deskId ? updated.desk : d)));
    setSavedById((prev) => ({ ...prev, [deskId]: updated.desk }));
  }

  async function deleteDesk(deskId: string) {
    setStatus(null);
    await apiPost<{ ok: true }>("/api/admin/desks/delete", { deskId });
    setDesks((prev) => prev.filter((d) => d.id !== deskId));
    setSelectedDeskId((prev) => (prev === deskId ? null : prev));
    setSavedById((prev) => {
      const next = { ...prev };
      delete next[deskId];
      return next;
    });
  }

  function onBackgroundPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;

    const bounds = getBounds();
    if (!bounds) return;

    // Only handle clicks that are NOT on a desk overlay.
    // Note: clicks on the base layout image should still count as background clicks.
    const target = e.target as HTMLElement | null;
    if (target?.closest?.('[data-desk-overlay="true"]')) return;

    const pos = getPointerPos(e, bounds);
    const normX = toNormalizedAbs(pos.x, bounds.width);
    const normY = toNormalizedAbs(pos.y, bounds.height);

    void createDeskAt(normX, normY).catch((err) => {
      setStatus(err instanceof Error ? err.message : "Failed to create desk");
    });
  }

  function startMove(e: React.PointerEvent, desk: DeskOverlay) {
    if (e.button !== 0) return;
    const bounds = getBounds();
    if (!bounds) return;

    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const pos = getPointerPos(e, bounds);
    setDrag({ kind: "move", deskId: desk.id, startX: pos.x, startY: pos.y, startDesk: desk });
    setSelectedDeskId(desk.id);
  }

  function startResize(e: React.PointerEvent, desk: DeskOverlay, corner: "nw" | "ne" | "sw" | "se") {
    if (e.button !== 0) return;
    const bounds = getBounds();
    if (!bounds) return;

    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const pos = getPointerPos(e, bounds);
    setDrag({ kind: "resize", deskId: desk.id, corner, startX: pos.x, startY: pos.y, startDesk: desk });
    setSelectedDeskId(desk.id);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (drag.kind === "none") return;

    // Throttle updates to ~1/frame to reduce lag.
    pendingPointRef.current = { x: e.clientX, y: e.clientY };
    if (rafRef.current !== null) return;

    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      const bounds = getBounds();
      const pending = pendingPointRef.current;
      if (!bounds || !pending) return;

      const pos = {
        x: pending.x - bounds.left,
        y: pending.y - bounds.top,
      };

      // IMPORTANT: deltas must NOT be clamped; users need to move left/up and resize from any corner.
      const dxNorm = toNormalizedDelta(pos.x - drag.startX, bounds.width);
      const dyNorm = toNormalizedDelta(pos.y - drag.startY, bounds.height);

      setDesks((prev) =>
        prev.map((d) => {
          if (d.id !== drag.deskId) return d;

          if (drag.kind === "move") {
            const nextX = clamp(drag.startDesk.x + dxNorm, 0, 1 - d.width);
            const nextY = clamp(drag.startDesk.y + dyNorm, 0, 1 - d.height);
            return { ...d, x: nextX, y: nextY };
          }

          const s = drag.startDesk;
          let x = s.x;
          let y = s.y;
          let width = s.width;
          let height = s.height;

          if (drag.corner === "se") {
            width = clamp01(s.width + dxNorm);
            height = clamp01(s.height + dyNorm);
          } else if (drag.corner === "sw") {
            x = clamp01(s.x + dxNorm);
            width = clamp01(s.width - dxNorm);
            height = clamp01(s.height + dyNorm);
          } else if (drag.corner === "ne") {
            y = clamp01(s.y + dyNorm);
            width = clamp01(s.width + dxNorm);
            height = clamp01(s.height - dyNorm);
          } else if (drag.corner === "nw") {
            x = clamp01(s.x + dxNorm);
            y = clamp01(s.y + dyNorm);
            width = clamp01(s.width - dxNorm);
            height = clamp01(s.height - dyNorm);
          }

          // Keep minimum size
          width = Math.max(width, 0.01);
          height = Math.max(height, 0.01);

          const rect = normalizeRect({ x, y, width, height });
          return { ...d, ...rect };
        }),
      );
    });
  }

  function onPointerUp() {
    if (drag.kind === "none") return;

    const changedDesk = desksRef.current.find((d) => d.id === drag.deskId);
    setDrag({ kind: "none" });

    if (!changedDesk) return;

    void saveDesk(changedDesk).catch((err) => {
      setStatus(err instanceof Error ? err.message : "Failed to save desk");
    });
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <p className="text-sm text-slate-600">Click the map to add a desk. Drag to move. Drag a corner to resize.</p>
      </div>

      {status ? <p className="text-sm text-slate-600">{status}</p> : null}

      <div className="w-full overflow-auto">
        <div className="relative inline-block">
          <div
            ref={containerRef}
            className="relative h-auto w-[min(1400px,100%)] select-none touch-none"
            onPointerDown={onBackgroundPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <img
              src={baseSrc}
              alt="Office layout"
              className="pointer-events-none block h-auto w-full"
              draggable={false}
            />

            {desks.map((d) => {
              const isSelected = d.id === selectedDeskId;
              const isEnabled = d.enabled;

              const left = `${d.x * 100}%`;
              const top = `${d.y * 100}%`;
              const width = `${d.width * 100}%`;
              const height = `${d.height * 100}%`;

              return (
                <div
                  key={d.id}
                  data-desk-overlay="true"
                  className={`absolute border text-[10px] ${
                    isSelected ? "border-black" : isEnabled ? "border-slate-700" : "border-yellow-700"
                  } ${isEnabled ? "bg-white/30" : "bg-yellow-300/40"}`}
                  style={{ left, top, width, height }}
                  onPointerDown={(e) => startMove(e, d)}
                >
                  <div className="pointer-events-none truncate p-1">{d.label}</div>

                  {isSelected ? (
                    <>
                      {(
                        [
                          ["nw", "-left-1 -top-1"],
                          ["ne", "-right-1 -top-1"],
                          ["sw", "-left-1 -bottom-1"],
                          ["se", "-right-1 -bottom-1"],
                        ] as const
                      ).map(([corner, cls]) => (
                        <button
                          key={corner}
                          type="button"
                          aria-label={`Resize ${corner}`}
                          className={`absolute h-3 w-3 rounded border bg-white ${cls}`}
                          onPointerDown={(e) => startResize(e, d, corner)}
                        />
                      ))}
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-3 rounded border p-4">
        <h3 className="text-lg font-semibold">Selected desk</h3>

        {selectedDesk ? (
          <SelectedDeskForm
            desk={selectedDesk}
            onChange={(next) => setDesks((prev) => prev.map((d) => (d.id === next.id ? next : d)))}
            onSave={() =>
              void saveDesk(selectedDesk).catch((err) => {
                setStatus(err instanceof Error ? err.message : "Failed to save desk");
              })
            }
            onToggleEnabled={() =>
              void (selectedDesk.enabled ? disableDesk(selectedDesk.id) : enableDesk(selectedDesk.id)).catch((err) =>
                setStatus(String(err)),
              )
            }
            onDelete={() => void deleteDesk(selectedDesk.id).catch((err) => setStatus(String(err)))}
            isDirty={isDeskDirty(selectedDesk)}
            isSaving={isSaving}
          />
        ) : (
          <p className="text-sm text-slate-600">Click a desk overlay to edit it.</p>
        )}
      </div>

      <div className="grid gap-3 rounded border p-4">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-lg font-semibold">All desks</h3>
          <p className="text-xs text-slate-600">{desks.length} total</p>
        </div>

        {desks.length === 0 ? (
          <p className="text-sm text-slate-600">No desks yet. Click the map to create one.</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead>
                <tr className="text-left">
                  <th className="border-b p-2">Label</th>
                  <th className="border-b p-2">Status</th>
                  <th className="border-b p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...desks]
                  .sort((a, b) => a.label.localeCompare(b.label))
                  .map((d) => {
                    const isSelected = d.id === selectedDeskId;
                    return (
                      <tr key={d.id} className={isSelected ? "bg-slate-50" : undefined}>
                        <td className="border-b p-2">
                          <button
                            type="button"
                            className="text-left underline"
                            onClick={() => setSelectedDeskId(d.id)}
                            title="Select and highlight on map"
                          >
                            {d.label}
                          </button>
                        </td>

                        <td className="border-b p-2">
                          <span className={d.enabled ? "text-slate-700" : "text-slate-500"}>
                            {d.enabled ? "Enabled" : "Disabled"}
                          </span>
                        </td>

                        <td className="border-b p-2">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="rounded border px-2 py-1"
                              onClick={() => setSelectedDeskId(d.id)}
                            >
                              Select
                            </button>

                            <button
                              type="button"
                              className="rounded border px-2 py-1"
                              onClick={() =>
                                void (d.enabled ? disableDesk(d.id) : enableDesk(d.id)).catch((err) =>
                                  setStatus(String(err)),
                                )
                              }
                            >
                              {d.enabled ? "Disable" : "Enable"}
                            </button>

                            <button
                              type="button"
                              className="rounded border px-2 py-1"
                              onClick={() => void deleteDesk(d.id).catch((err) => setStatus(String(err)))}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-600">All geometry is stored normalized (0..1) relative to the layout image.</p>
    </section>
  );
}

function SelectedDeskForm({
  desk,
  onChange,
  onSave,
  onToggleEnabled,
  onDelete,
  isDirty,
  isSaving,
}: {
  desk: DeskOverlay;
  onChange: (next: DeskOverlay) => void;
  onSave: () => void;
  onToggleEnabled: () => void;
  onDelete: () => void;
  isDirty: boolean;
  isSaving: boolean;
}) {
  return (
    <div className="grid gap-3">
      <label className="grid gap-1">
        <span className="text-sm">Label</span>
        <input
          className="rounded border px-3 py-2"
          value={desk.label}
          onChange={(e) => onChange({ ...desk, label: e.target.value })}
          onBlur={() => {
            if (!isDirty || isSaving) return;
            onSave();
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            if (isSaving) return;
            onSave();
          }}
        />
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={desk.enabled}
          onChange={(e) => onChange({ ...desk, enabled: e.target.checked })}
        />
        <span className="text-sm">Enabled</span>
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded border px-3 py-2 text-sm"
          onClick={onSave}
          disabled={!isDirty || isSaving}
          title={isDirty ? "Save changes" : "No changes to save"}
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
        <button type="button" className="rounded border px-3 py-2 text-sm" onClick={onToggleEnabled}>
          {desk.enabled ? "Disable" : "Enable"}
        </button>
        <button type="button" className="rounded border px-3 py-2 text-sm" onClick={onDelete}>
          Delete
        </button>
      </div>

      {isDirty ? (
        <p className="text-xs text-slate-600">Unsaved changes. Click Save (or press Enter).</p>
      ) : (
        <p className="text-xs text-slate-600">All changes saved.</p>
      )}
    </div>
  );
}
