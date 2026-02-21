"use client";

import { useMemo, useRef, useState } from "react";

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
  referenceSrc?: string | null;
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

function round4(n: number) {
  return Math.round(n * 10000) / 10000;
}

function toNormalized(px: number, sizePx: number) {
  if (sizePx <= 0) return 0;
  return clamp01(px / sizePx);
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
  referenceSrc,
  initialDesks,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [desks, setDesks] = useState<DeskOverlay[]>(initialDesks);
  const [selectedDeskId, setSelectedDeskId] = useState<string | null>(null);
  const [showReference, setShowReference] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragMode>({ kind: "none" });

  const selectedDesk = useMemo(
    () => desks.find((d) => d.id === selectedDeskId) ?? null,
    [desks, selectedDeskId],
  );

  function getBounds() {
    const el = containerRef.current;
    if (!el) return null;
    return el.getBoundingClientRect();
  }

  async function createDeskAt(normX: number, normY: number) {
    setStatus(null);

    const width = 0.045;
    const height = 0.035;
    const x = clamp01(normX - width / 2);
    const y = clamp01(normY - height / 2);

    const created = await apiPost<{ desk: DeskOverlay }>("/api/admin/desks/create", {
      layoutId,
      label: `Desk ${desks.length + 1}`,
      x: round4(x),
      y: round4(y),
      width: round4(width),
      height: round4(height),
    });

    setDesks((prev) => [created.desk, ...prev]);
    setSelectedDeskId(created.desk.id);
  }

  async function saveDesk(next: DeskOverlay) {
    setStatus(null);

    const updated = await apiPost<{ desk: DeskOverlay }>("/api/admin/desks/update", {
      deskId: next.id,
      label: next.label,
      enabled: next.enabled,
      x: round4(clamp01(next.x)),
      y: round4(clamp01(next.y)),
      width: round4(clamp01(next.width)),
      height: round4(clamp01(next.height)),
    });

    setDesks((prev) => prev.map((d) => (d.id === updated.desk.id ? updated.desk : d)));
  }

  async function disableDesk(deskId: string) {
    setStatus(null);
    const updated = await apiPost<{ desk: DeskOverlay }>("/api/admin/desks/disable", { deskId });
    setDesks((prev) => prev.map((d) => (d.id === deskId ? updated.desk : d)));
  }

  async function deleteDesk(deskId: string) {
    setStatus(null);
    await apiPost<{ ok: true }>("/api/admin/desks/delete", { deskId });
    setDesks((prev) => prev.filter((d) => d.id !== deskId));
    setSelectedDeskId((prev) => (prev === deskId ? null : prev));
  }

  function onBackgroundPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;

    const bounds = getBounds();
    if (!bounds) return;

    // Only handle clicks on the background itself (not on a desk)
    if (e.target !== e.currentTarget) return;

    const pos = getPointerPos(e, bounds);
    const normX = toNormalized(pos.x, bounds.width);
    const normY = toNormalized(pos.y, bounds.height);

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
    const bounds = getBounds();
    if (!bounds) return;

    const pos = getPointerPos(e, bounds);
    const dxNorm = toNormalized(pos.x - drag.startX, bounds.width);
    const dyNorm = toNormalized(pos.y - drag.startY, bounds.height);

    setDesks((prev) =>
      prev.map((d) => {
        if (d.id !== drag.deskId) return d;

        if (drag.kind === "move") {
          const nextX = clamp01(drag.startDesk.x + dxNorm);
          const nextY = clamp01(drag.startDesk.y + dyNorm);
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

        return { ...d, x, y, width, height };
      }),
    );
  }

  function onPointerUp() {
    if (drag.kind === "none") return;

    const changedDesk = desks.find((d) => d.id === drag.deskId);
    setDrag({ kind: "none" });

    if (!changedDesk) return;

    void saveDesk(changedDesk).catch((err) => {
      setStatus(err instanceof Error ? err.message : "Failed to save desk");
    });
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <input
            id="show-reference"
            type="checkbox"
            className="h-4 w-4"
            checked={showReference}
            onChange={(e) => setShowReference(e.target.checked)}
            disabled={!referenceSrc}
          />
          <label htmlFor="show-reference" className="text-sm">
            Show desk highlight overlay
          </label>
        </div>

        <p className="text-sm text-slate-600">Click the map to add a desk. Drag to move. Drag a corner to resize.</p>
      </div>

      {status ? <p className="text-sm text-slate-600">{status}</p> : null}

      <div className="w-full overflow-auto">
        <div className="relative inline-block">
          <div
            ref={containerRef}
            className="relative h-auto w-[min(1400px,100%)] select-none"
            onPointerDown={onBackgroundPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <img src={baseSrc} alt="Office layout" className="block h-auto w-full" draggable={false} />

            {referenceSrc && showReference ? (
              <img
                src={referenceSrc}
                alt="Desk highlight overlay"
                className="pointer-events-none absolute inset-0 h-auto w-full opacity-50"
                draggable={false}
              />
            ) : null}

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
                  className={`absolute border text-[10px] ${
                    isSelected ? "border-black" : "border-slate-700"
                  } ${isEnabled ? "bg-white/30" : "bg-slate-400/30"}`}
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
            onDisable={() => void disableDesk(selectedDesk.id).catch((err) => setStatus(String(err)))}
            onDelete={() => void deleteDesk(selectedDesk.id).catch((err) => setStatus(String(err)))}
          />
        ) : (
          <p className="text-sm text-slate-600">Click a desk overlay to edit it.</p>
        )}
      </div>

      <p className="text-xs text-slate-600">All geometry is stored normalized (0..1) relative to the layout image.</p>
    </section>
  );
}

function SelectedDeskForm({
  desk,
  onChange,
  onDisable,
  onDelete,
}: {
  desk: DeskOverlay;
  onChange: (next: DeskOverlay) => void;
  onDisable: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="grid gap-3">
      <label className="grid gap-1">
        <span className="text-sm">Label</span>
        <input
          className="rounded border px-3 py-2"
          value={desk.label}
          onChange={(e) => onChange({ ...desk, label: e.target.value })}
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
        <button type="button" className="rounded border px-3 py-2 text-sm" onClick={onDisable}>
          Disable
        </button>
        <button type="button" className="rounded border px-3 py-2 text-sm" onClick={onDelete}>
          Delete
        </button>
      </div>

      <p className="text-xs text-slate-600">Changes save automatically when you finish dragging/resizing.</p>
    </div>
  );
}
