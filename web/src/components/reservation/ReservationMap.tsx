"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type DeskAvailability = {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  reserved: boolean;
  reservation: null | { reservationId: string; personName: string; startAt: string; endAt: string };
};

type PersonOption = { id: string; displayName: string };

type Props = {
  layoutId: string;
  baseSrc: string;
  referenceSrc?: string | null;
  currentUser: {
    id: string;
    role: "ADMIN" | "USER";
    personId: string | null;
  };
};

function toIso(dtLocalValue: string) {
  // datetime-local has no timezone; interpret as local time and send ISO
  const d = new Date(dtLocalValue);
  return d.toISOString();
}

function nowRoundedToMinutes() {
  const d = new Date();
  d.setSeconds(0, 0);
  return d;
}

function addHours(d: Date, hours: number) {
  const next = new Date(d.getTime());
  next.setHours(next.getHours() + hours);
  return next;
}

function addMinutes(d: Date, minutes: number) {
  const next = new Date(d.getTime());
  next.setMinutes(next.getMinutes() + minutes);
  return next;
}

function formatLocal(iso: string) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleString();
}

function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as T;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = typeof (data as any).error === "string" ? (data as any).error : `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data as T;
}

export function ReservationMap({ layoutId, baseSrc, referenceSrc, currentUser }: Props) {
  const defaultStart = useMemo(() => nowRoundedToMinutes(), []);
  const defaultEnd = useMemo(() => addHours(defaultStart, 1), [defaultStart]);

  const [startAtLocal, setStartAtLocal] = useState(() => toDatetimeLocalValue(defaultStart));
  const [endAtLocal, setEndAtLocal] = useState(() => toDatetimeLocalValue(defaultEnd));

  const [showReference, setShowReference] = useState(Boolean(referenceSrc));
  const [desks, setDesks] = useState<DeskAvailability[]>([]);
  const [people, setPeople] = useState<PersonOption[]>([]);
  const [selectedDeskId, setSelectedDeskId] = useState<string | null>(null);
  const [hoveredDeskId, setHoveredDeskId] = useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string>(currentUser.personId ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const mapRef = useRef<HTMLDivElement | null>(null);

  const selectedDesk = useMemo(() => desks.find((d) => d.id === selectedDeskId) ?? null, [desks, selectedDeskId]);

  async function refreshAvailability() {
    setIsLoading(true);
    try {
      const startAt = toIso(startAtLocal);
      const endAt = toIso(endAtLocal);

      const availability = await getJson<{ desks: DeskAvailability[] }>(
        `/api/availability?layoutId=${encodeURIComponent(layoutId)}&startAt=${encodeURIComponent(startAt)}&endAt=${encodeURIComponent(endAt)}`,
      );

      setDesks(availability.desks);
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshPeople() {
    if (currentUser.role !== "ADMIN") {
      setPeople([]);
      setSelectedPersonId(currentUser.personId ?? "");
      return;
    }

    const personnel = await getJson<{ items: PersonOption[] }>("/api/personnel");
    setPeople(personnel.items);

    if (!selectedPersonId && personnel.items.length > 0) {
      setSelectedPersonId(personnel.items[0].id);
    }
  }

  useEffect(() => {
    setStatus(null);
    void refreshAvailability().catch((err) => setStatus(err instanceof Error ? err.message : "Failed to load"));
    void refreshPeople().catch((err) => setStatus(err instanceof Error ? err.message : "Failed to load"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutId]);

  useEffect(() => {
    setStatus(null);
    const handle = window.setTimeout(() => {
      void refreshAvailability().catch((err) => setStatus(err instanceof Error ? err.message : "Failed to load"));
    }, 250);

    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startAtLocal, endAtLocal]);

  async function onCheckAvailability() {
    setStatus(null);
    void refreshAvailability().catch((err) => setStatus(err instanceof Error ? err.message : "Failed to load"));
  }

  function applyDurationMinutes(minutes: number) {
    const start = new Date(startAtLocal);
    if (!Number.isFinite(start.getTime())) return;
    setEndAtLocal(toDatetimeLocalValue(addMinutes(start, minutes)));
  }

  const durationMinutes = useMemo(() => {
    const start = new Date(startAtLocal);
    const end = new Date(endAtLocal);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return null;
    const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
    if (!Number.isFinite(minutes) || minutes <= 0) return null;
    return minutes;
  }, [startAtLocal, endAtLocal]);

  async function onReserve() {
    if (!selectedDesk) return;
    setStatus(null);

    const personId = currentUser.role === "USER" ? currentUser.personId : selectedPersonId;
    if (!personId) {
      setStatus("Select a person.");
      return;
    }

    try {
      await postJson("/api/reservations/create", {
        deskId: selectedDesk.id,
        personId,
        startAt: toIso(startAtLocal),
        endAt: toIso(endAtLocal),
      });

      await refreshAvailability();
      setStatus("Reservation created.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to reserve");
    }
  }

  async function onAdminCancel() {
    if (!selectedDesk?.reservation) return;
    setStatus(null);

    try {
      await postJson("/api/reservations/cancel", { reservationId: selectedDesk.reservation.reservationId });
      await refreshAvailability();
      setStatus("Reservation cancelled.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to cancel");
    }
  }

  function selectDeskAtPoint(clientX: number, clientY: number) {
    const el = mapRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;

    const hits = desks.filter((d) => x >= d.x && x <= d.x + d.width && y >= d.y && y <= d.y + d.height);
    if (hits.length === 0) return;

    // If multiple desks overlap, pick the smallest (most specific) hit.
    hits.sort((a, b) => a.width * a.height - b.width * b.height);
    setSelectedDeskId(hits[0].id);
    setStatus(null);
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="grid gap-3 rounded border p-4">
        <div className="flex flex-wrap items-end gap-4">
          <label className="grid gap-1">
            <span className="text-sm">Start</span>
            <input
              type="datetime-local"
              className="rounded border px-3 py-2"
              value={startAtLocal}
              onChange={(e) => setStartAtLocal(e.target.value)}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm">End</span>
            <input
              type="datetime-local"
              className="rounded border px-3 py-2"
              value={endAtLocal}
              onChange={(e) => setEndAtLocal(e.target.value)}
            />
          </label>

          <button type="button" className="h-10 rounded border px-3 text-sm" onClick={onCheckAvailability}>
            Check availability
          </button>

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
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-600">Duration</span>
          <button type="button" className="h-9 rounded border px-3 text-sm" onClick={() => applyDurationMinutes(30)}>
            30m
          </button>
          <button type="button" className="h-9 rounded border px-3 text-sm" onClick={() => applyDurationMinutes(60)}>
            1h
          </button>
          <button type="button" className="h-9 rounded border px-3 text-sm" onClick={() => applyDurationMinutes(120)}>
            2h
          </button>
          <button type="button" className="h-9 rounded border px-3 text-sm" onClick={() => applyDurationMinutes(240)}>
            4h
          </button>

          {durationMinutes ? <span className="text-xs text-slate-600">({durationMinutes} minutes)</span> : null}
        </div>

        <p className="text-xs text-slate-600">
          Desks loaded: {desks.length}
          {isLoading ? " (loading…)" : ""}
        </p>

        {desks.length === 0 && !isLoading ? (
          <p className="text-xs text-slate-600">
            If you only see the green squares in the highlight image but cannot hover/click, there are no desk overlays configured yet.
            {" "}
            Admins can add them in Admin: Desks.
          </p>
        ) : null}

        {status ? <p className="text-sm text-slate-600">{status}</p> : null}
      </div>

      <div className="w-full overflow-auto">
        <div className="relative inline-block">
          <div
            ref={mapRef}
            className="relative h-auto w-[min(1400px,100%)] select-none"
            onClick={(e) => selectDeskAtPoint(e.clientX, e.clientY)}
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
              const isHovered = d.id === hoveredDeskId;
              const left = `${d.x * 100}%`;
              const top = `${d.y * 100}%`;
              const width = `${d.width * 100}%`;
              const height = `${d.height * 100}%`;

              const title = d.reserved && d.reservation
                ? `${d.label} — Reserved by ${d.reservation.personName} until ${formatLocal(d.reservation.endAt)}`
                : `${d.label} — Available`;

              return (
                <button
                  key={d.id}
                  type="button"
                  title={title}
                  className={`absolute border text-left text-[10px] ${
                    d.reserved ? "border-red-700 bg-red-500/40" : "border-green-700 bg-green-500/35"
                  } cursor-pointer hover:z-20 hover:outline hover:outline-2 hover:outline-slate-900 ${
                    isHovered ? "z-20 outline outline-2 outline-slate-900" : "z-10"
                  } ${isSelected ? "outline outline-2 outline-black" : ""}`}
                  style={{ left, top, width, height }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDeskId(d.id);
                    setStatus(null);
                  }}
                  onMouseEnter={() => setHoveredDeskId(d.id)}
                  onMouseLeave={() => setHoveredDeskId((cur) => (cur === d.id ? null : cur))}
                >
                  <div className="truncate p-1">{d.label}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-3 rounded border p-4">
        <h3 className="text-lg font-semibold">Reservation</h3>

        {selectedDesk ? (
          <>
            <p className="text-sm text-slate-600">
              Desk: <span className="font-medium text-slate-900">{selectedDesk.label}</span>
            </p>

            {selectedDesk.reserved && selectedDesk.reservation ? (
              <p className="text-sm text-slate-600">
                Reserved by {selectedDesk.reservation.personName} until {formatLocal(selectedDesk.reservation.endAt)}
              </p>
            ) : (
              <p className="text-sm text-slate-600">Available</p>
            )}

            {selectedDesk.reserved ? (
              currentUser.role === "ADMIN" && selectedDesk.reservation ? (
                <button type="button" className="w-fit rounded border px-3 py-2 text-sm" onClick={onAdminCancel}>
                  Cancel reservation
                </button>
              ) : (
                <p className="text-xs text-slate-600">Only admins can cancel reservations in the MVP.</p>
              )
            ) : (
              <>
                {currentUser.role === "ADMIN" ? (
                  <label className="grid gap-1">
                    <span className="text-sm">Person</span>
                    <select
                      className="rounded border px-3 py-2 text-sm"
                      value={selectedPersonId}
                      onChange={(e) => setSelectedPersonId(e.target.value)}
                    >
                      {people.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.displayName}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <p className="text-xs text-slate-600">Users can only reserve for themselves.</p>
                )}

                <button type="button" className="w-fit rounded border px-3 py-2 text-sm" onClick={onReserve}>
                  Reserve desk
                </button>
              </>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-600">Click a desk on the map to reserve it.</p>
        )}
      </div>
    </section>
  );
}
