"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type DeskAvailability = {
  id: string;
  label: string;
  enabled: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  reserved: boolean;
  reservation: null | { reservationId: string; personName: string; startAt: string; endAt: string };
};

type PersonOption = { id: string; displayName: string };

type DeskReservationItem = { id: string; personName: string; startAt: string; endAt: string };

type Props = {
  layoutId: string;
  baseSrc: string;
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

function toDateValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
}

function toYearMonthValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  return `${yyyy}-${mm}`;
}

function parseYearMonthValue(value: string) {
  const m = /^([0-9]{4})-([0-9]{2})$/.exec(value);
  if (!m) return null;
  const year = Number(m[1]);
  const monthIndex = Number(m[2]) - 1;
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) return null;
  if (monthIndex < 0 || monthIndex > 11) return null;
  const d = new Date(year, monthIndex, 1);
  return Number.isFinite(d.getTime()) ? d : null;
}

function parseDateValue(value: string) {
  // HTML date input is always YYYY-MM-DD
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(value);
  if (!m) return null;
  const year = Number(m[1]);
  const monthIndex = Number(m[2]) - 1;
  const day = Number(m[3]);
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || !Number.isFinite(day)) return null;
  const d = new Date(year, monthIndex, day);
  return Number.isFinite(d.getTime()) ? d : null;
}

function startOfLocalDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function addDays(d: Date, days: number) {
  const next = new Date(d.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

function formatLocalTime(iso: string) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
}

function parseDatetimeLocalValue(value: string) {
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: "GET", cache: "no-store" });
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

export function ReservationMap({ layoutId, baseSrc, currentUser }: Props) {
  const defaultStart = useMemo(() => nowRoundedToMinutes(), []);
  const defaultEnd = useMemo(() => addHours(defaultStart, 1), [defaultStart]);

  const [startAtLocal, setStartAtLocal] = useState(() => toDatetimeLocalValue(defaultStart));
  const [endAtLocal, setEndAtLocal] = useState(() => toDatetimeLocalValue(defaultEnd));

  const [desks, setDesks] = useState<DeskAvailability[]>([]);
  const [people, setPeople] = useState<PersonOption[]>([]);
  const [selectedDeskId, setSelectedDeskId] = useState<string | null>(null);
  const [hoveredDeskId, setHoveredDeskId] = useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string>(currentUser.personId ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [calendarMonth, setCalendarMonth] = useState(() => toYearMonthValue(new Date()));
  const [calendarSelectedDay, setCalendarSelectedDay] = useState(() => toDateValue(new Date()));
  const [calendarItems, setCalendarItems] = useState<DeskReservationItem[]>([]);
  const [calendarStatus, setCalendarStatus] = useState<string | null>(null);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [highlightReservationId, setHighlightReservationId] = useState<string | null>(null);
  const [calendarReloadToken, setCalendarReloadToken] = useState(0);
  const calendarSilentNextRef = useRef(false);

  const mapRef = useRef<HTMLDivElement | null>(null);
  const lastSelectedDeskIdRef = useRef<string | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);

  const selectedDesk = useMemo(() => desks.find((d) => d.id === selectedDeskId) ?? null, [desks, selectedDeskId]);

  async function refreshAvailability(options?: { silent?: boolean }) {
    const silent = options?.silent === true;
    if (!silent) setIsLoading(true);

    try {
      const startAt = toIso(startAtLocal);
      const endAt = toIso(endAtLocal);

      const availability = await getJson<{ desks: DeskAvailability[] }>(
        `/api/availability?layoutId=${encodeURIComponent(layoutId)}&startAt=${encodeURIComponent(startAt)}&endAt=${encodeURIComponent(endAt)}`,
      );

      setDesks(availability.desks);
    } finally {
      if (!silent) setIsLoading(false);
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

  useEffect(() => {
    // If the selected time window is fully in the past, the UI would keep showing
    // historical availability (e.g. the desk stays red because it WAS reserved in that past window).
    // Auto-advance the window forward to keep the map reflecting current availability.
    const handle = window.setInterval(() => {
      const start = parseDatetimeLocalValue(startAtLocal);
      const end = parseDatetimeLocalValue(endAtLocal);
      if (!start || !end) return;

      const durationMs = end.getTime() - start.getTime();
      if (!Number.isFinite(durationMs) || durationMs <= 0) return;

      const now = new Date();
      if (end.getTime() > now.getTime()) return;

      const nextStart = nowRoundedToMinutes();
      const nextEnd = new Date(nextStart.getTime() + durationMs);

      setStartAtLocal(toDatetimeLocalValue(nextStart));
      setEndAtLocal(toDatetimeLocalValue(nextEnd));
      setSelectedDeskId(null);
      setStatus(null);
    }, 10_000);

    return () => window.clearInterval(handle);
  }, [startAtLocal, endAtLocal]);

  useEffect(() => {
    // Auto-refresh so desks flip back to available once reservations expire.
    // Keep this silent to avoid flickering the loading indicator.
    const handle = window.setInterval(() => {
      void refreshAvailability({ silent: true }).catch(() => {
        // ignore background refresh errors; user-initiated changes still surface errors
      });
    }, 30_000);

    return () => window.clearInterval(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutId, startAtLocal, endAtLocal]);

  useEffect(() => {
    // When a desk is selected, default the calendar day to the current "Start" date.
    if (!selectedDeskId) {
      lastSelectedDeskIdRef.current = null;
      setCalendarItems([]);
      setCalendarStatus(null);
      setIsCalendarLoading(false);
      setHighlightReservationId(null);
      return;
    }

    if (lastSelectedDeskIdRef.current === selectedDeskId) return;
    lastSelectedDeskIdRef.current = selectedDeskId;

    const start = parseDatetimeLocalValue(startAtLocal);
    const base = start ?? new Date();
    setCalendarMonth(toYearMonthValue(base));
    setCalendarSelectedDay(toDateValue(base));
    setHighlightReservationId(null);
  }, [selectedDeskId, startAtLocal]);

  useEffect(() => {
    if (!selectedDeskId) return;

    const month = parseYearMonthValue(calendarMonth);
    if (!month) {
      setCalendarItems([]);
      setCalendarStatus("Invalid month.");
      return;
    }

    const controller = new AbortController();
    const monthStart = startOfLocalDay(month);
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 1, 0, 0, 0, 0);

    const silent = calendarSilentNextRef.current;
    calendarSilentNextRef.current = false;

    if (!silent) {
      setIsCalendarLoading(true);
      setCalendarStatus(null);
    }

    void (async () => {
      try {
        const url = `/api/reservations/list?deskId=${encodeURIComponent(selectedDeskId)}&startAt=${encodeURIComponent(
          monthStart.toISOString(),
        )}&endAt=${encodeURIComponent(monthEnd.toISOString())}`;

        const res = await fetch(url, { method: "GET", cache: "no-store", signal: controller.signal });
        const data = (await res.json().catch(() => ({}))) as any;
        if (!res.ok) {
          const message = typeof data?.error === "string" ? data.error : `Request failed (${res.status})`;
          throw new Error(message);
        }

        if (controller.signal.aborted) return;
        setCalendarItems(Array.isArray(data?.items) ? (data.items as DeskReservationItem[]) : []);
      } catch (err) {
        if (controller.signal.aborted) return;
        if (!silent) {
          setCalendarItems([]);
          setCalendarStatus(err instanceof Error ? err.message : "Failed to load calendar");
        }
      } finally {
        if (controller.signal.aborted) return;
        if (!silent) setIsCalendarLoading(false);
      }
    })();

    return () => controller.abort();
  }, [selectedDeskId, calendarMonth, calendarReloadToken]);

  useEffect(() => {
    // Keep the calendar/month view in sync with reservations created/cancelled by other users.
    // This is a simple polling approach to avoid adding server push complexity.
    if (!selectedDeskId) return;

    const handle = window.setInterval(() => {
      calendarSilentNextRef.current = true;
      setCalendarReloadToken((n) => n + 1);
    }, 30_000);

    return () => window.clearInterval(handle);
  }, [selectedDeskId]);

  const calendarSelectedItems = useMemo(() => {
    const day = parseDateValue(calendarSelectedDay);
    if (!day) return [];
    const dayStart = startOfLocalDay(day);
    const dayEnd = addDays(dayStart, 1);

    return calendarItems.filter((r) => {
      const start = new Date(r.startAt);
      const end = new Date(r.endAt);
      if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return false;
      return start.getTime() < dayEnd.getTime() && end.getTime() > dayStart.getTime();
    });
  }, [calendarItems, calendarSelectedDay]);

  function jumpToReservation(r: DeskReservationItem) {
    const start = new Date(r.startAt);
    if (Number.isFinite(start.getTime())) {
      setCalendarMonth(toYearMonthValue(start));
      setCalendarSelectedDay(toDateValue(start));
    }

    setHighlightReservationId(r.id);
    window.setTimeout(() => {
      timelineRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 0);
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

    if (!selectedDesk.enabled) {
      setStatus("That desk is disabled.");
      return;
    }

    const personId = currentUser.role === "USER" ? currentUser.personId : selectedPersonId;
    if (!personId) {
      setStatus("Select a person.");
      return;
    }

    try {
      const result = await postJson<{ reservation?: { id: string; startAt: string; endAt: string } }>(
        "/api/reservations/create",
        {
        deskId: selectedDesk.id,
        personId,
        startAt: toIso(startAtLocal),
        endAt: toIso(endAtLocal),
        },
      );

      await refreshAvailability();
      // Refresh month data so the calendar + list update immediately.
      setCalendarReloadToken((n) => n + 1);

      const created = result?.reservation;
      const createdStart = created?.startAt ? new Date(created.startAt) : null;
      if (created && createdStart && Number.isFinite(createdStart.getTime())) {
        setCalendarMonth(toYearMonthValue(createdStart));
        setCalendarSelectedDay(toDateValue(createdStart));
        setHighlightReservationId(created.id);
        window.setTimeout(() => {
          timelineRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }, 0);
      }

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

      setHighlightReservationId(null);
      setCalendarReloadToken((n) => n + 1);
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

    const hits = desks.filter(
      (d) => d.enabled && x >= d.x && x <= d.x + d.width && y >= d.y && y <= d.y + d.height,
    );
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

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Tip: green = available, red = reserved, yellow = disabled</span>
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

            {desks.map((d) => {
              const isSelected = d.id === selectedDeskId;
              const isHovered = d.id === hoveredDeskId;
              const left = `${d.x * 100}%`;
              const top = `${d.y * 100}%`;
              const width = `${d.width * 100}%`;
              const height = `${d.height * 100}%`;

              const title = !d.enabled
                ? `${d.label} — Disabled`
                : d.reserved && d.reservation
                  ? `${d.label} — Reserved by ${d.reservation.personName} until ${formatLocal(d.reservation.endAt)}`
                  : `${d.label} — Available`;

              const deskColors = !d.enabled
                ? "border-yellow-700 bg-yellow-300/40"
                : d.reserved
                  ? "border-red-700 bg-red-500/40"
                  : "border-green-700 bg-green-500/35";

              return (
                <button
                  key={d.id}
                  type="button"
                  title={title}
                  className={`absolute border text-left text-[10px] ${deskColors} ${
                    d.enabled ? "cursor-pointer" : "cursor-not-allowed"
                  } ${
                    d.enabled
                      ? "hover:z-20 hover:outline hover:outline-2 hover:outline-slate-900"
                      : ""
                  } ${isHovered ? "z-20 outline outline-2 outline-slate-900" : "z-10"} ${
                    isSelected ? "outline outline-2 outline-black" : ""
                  }`}
                  style={{ left, top, width, height }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!d.enabled) return;
                    setSelectedDeskId(d.id);
                    setStatus(null);
                  }}
                  onMouseEnter={() => {
                    if (!d.enabled) return;
                    setHoveredDeskId(d.id);
                  }}
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

            {!selectedDesk.enabled ? (
              <p className="text-sm text-slate-600">Disabled</p>
            ) : null}

            {selectedDesk.enabled && selectedDesk.reserved && selectedDesk.reservation ? (
              <p className="text-sm text-slate-600">
                Reserved by {selectedDesk.reservation.personName} until {formatLocal(selectedDesk.reservation.endAt)}
              </p>
            ) : selectedDesk.enabled ? (
              <p className="text-sm text-slate-600">Available</p>
            ) : null}

            {selectedDesk.enabled && selectedDesk.reserved ? (
              currentUser.role === "ADMIN" && selectedDesk.reservation ? (
                <button type="button" className="w-fit rounded border px-3 py-2 text-sm" onClick={onAdminCancel}>
                  Cancel reservation
                </button>
              ) : (
                <p className="text-xs text-slate-600">Only admins can cancel reservations in the MVP.</p>
              )
            ) : selectedDesk.enabled ? (
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
            ) : null}

            <div className="mt-2 grid gap-2 border-t pt-3">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h4 className="text-sm font-medium">Calendar</h4>
              </div>

              <MonthCalendar
                monthValue={calendarMonth}
                selectedDayValue={calendarSelectedDay}
                items={calendarItems}
                onChangeMonth={setCalendarMonth}
                onSelectDay={(v) => {
                  setCalendarSelectedDay(v);
                  setHighlightReservationId(null);
                }}
              />

              <p className="text-xs text-slate-600">Selected day time blocks: reserved = red, blank = available.</p>

              <div ref={timelineRef}>
                <DeskDayTimeline
                  dayValue={calendarSelectedDay}
                  items={calendarSelectedItems}
                  highlightReservationId={highlightReservationId}
                />
              </div>

              {isCalendarLoading ? <p className="text-xs text-slate-600">Loading calendar…</p> : null}
              {calendarStatus ? <p className="text-xs text-slate-600">{calendarStatus}</p> : null}

              {!isCalendarLoading && !calendarStatus && calendarSelectedItems.length === 0 ? (
                <p className="text-xs text-slate-600">No reservations for this desk on the selected day.</p>
              ) : null}

              {calendarSelectedItems.length > 0 ? (
                <div className="grid gap-1">
                  {calendarSelectedItems.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      className={`w-full rounded border px-2 py-1 text-left text-xs ${
                        highlightReservationId === r.id
                          ? "border-slate-900 bg-slate-50 text-slate-900"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                      onClick={() => jumpToReservation(r)}
                    >
                      <span className="font-medium text-slate-900">
                        {formatLocalTime(r.startAt)}–{formatLocalTime(r.endAt)}
                      </span>
                      <span className="text-slate-600"> • {r.personName}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-600">Click a desk on the map to reserve it.</p>
        )}
      </div>
    </section>
  );
}

function MonthCalendar({
  monthValue,
  selectedDayValue,
  items,
  onChangeMonth,
  onSelectDay,
}: {
  monthValue: string;
  selectedDayValue: string;
  items: DeskReservationItem[];
  onChangeMonth: (value: string) => void;
  onSelectDay: (value: string) => void;
}) {
  const month = parseYearMonthValue(monthValue) ?? new Date();
  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  const monthStart = new Date(year, monthIndex, 1);
  const monthStartLocal = startOfLocalDay(monthStart);
  const monthEndLocal = startOfLocalDay(new Date(year, monthIndex + 1, 1));
  const firstWeekday = monthStart.getDay(); // 0=Sun
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    const list: number[] = [];
    for (let y = current - 5; y <= current + 5; y++) list.push(y);
    // Ensure the currently selected year is always included.
    if (!list.includes(year)) list.push(year);
    list.sort((a, b) => a - b);
    return list;
  }, [year]);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const reservedByDay = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of items) {
      const start = new Date(r.startAt);
      const end = new Date(r.endAt);
      if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) continue;

      // Mark each affected day in the visible month.
      // Intersect the reservation with the current month so multi-year reservations stay fast and accurate.
      const overlapStart = new Date(Math.max(start.getTime(), monthStartLocal.getTime()));
      const overlapEnd = new Date(Math.min(end.getTime(), monthEndLocal.getTime()));
      if (overlapStart.getTime() >= overlapEnd.getTime()) continue;

      let cursor = startOfLocalDay(overlapStart);
      const last = startOfLocalDay(addDays(overlapEnd, -1));

      while (cursor.getTime() <= last.getTime()) {
        const key = toDateValue(cursor);
        map[key] = (map[key] ?? 0) + 1;
        cursor = addDays(cursor, 1);
      }
    }
    return map;
  }, [items, monthIndex, monthEndLocal, monthStartLocal, year]);

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-1">
          <span className="text-xs text-slate-600">Month</span>
          <div className="flex flex-wrap gap-2">
            <select
              className="h-9 rounded border px-3 text-sm"
              value={String(monthIndex)}
              onChange={(e) => {
                const nextMonthIndex = Number(e.target.value);
                if (!Number.isFinite(nextMonthIndex)) return;
                onChangeMonth(toYearMonthValue(new Date(year, nextMonthIndex, 1)));
              }}
            >
              {monthNames.map((name, idx) => (
                <option key={name} value={String(idx)}>
                  {name}
                </option>
              ))}
            </select>

            <select
              className="h-9 rounded border px-3 text-sm"
              value={String(year)}
              onChange={(e) => {
                const nextYear = Number(e.target.value);
                if (!Number.isFinite(nextYear)) return;
                onChangeMonth(toYearMonthValue(new Date(nextYear, monthIndex, 1)));
              }}
            >
              {yearOptions.map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-xs text-slate-600">
          {monthNames[monthIndex]} {year}
        </p>
      </div>

      <div className="grid grid-cols-7 gap-1 text-[10px] font-medium text-slate-700">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="px-1 py-0.5 text-center">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 42 }, (_, cellIndex) => {
          const dayNumber = cellIndex - firstWeekday + 1;
          const inMonth = dayNumber >= 1 && dayNumber <= daysInMonth;
          if (!inMonth) {
            return <div key={cellIndex} className="h-9 rounded border border-slate-200 bg-slate-50" />;
          }

          const dayValue = toDateValue(new Date(year, monthIndex, dayNumber));
          const isSelected = dayValue === selectedDayValue;
          const reservationCount = reservedByDay[dayValue] ?? 0;

          const bg = reservationCount > 0 ? "bg-red-100" : "bg-white";
          const border = reservationCount > 0 ? "border-red-300" : "border-slate-300";

          return (
            <button
              key={cellIndex}
              type="button"
              className={`h-10 rounded border px-2 text-left text-sm font-medium text-slate-900 ${bg} ${border} ${
                isSelected
                  ? "outline outline-2 outline-black"
                  : "hover:outline hover:outline-2 hover:outline-slate-900"
              }`}
              title={reservationCount > 0 ? `${reservationCount} reservation(s) on this day` : "No reservations"}
              onClick={() => onSelectDay(dayValue)}
            >
              <div className="flex items-center justify-between">
                <span>{dayNumber}</span>
                {reservationCount > 0 ? <span className="h-2 w-2 rounded-full bg-red-700" aria-label="Reserved" /> : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DeskDayTimeline({
  dayValue,
  items,
  highlightReservationId,
}: {
  dayValue: string;
  items: DeskReservationItem[];
  highlightReservationId: string | null;
}) {
  const day = parseDateValue(dayValue);
  const dayStart = day ? startOfLocalDay(day) : null;
  const minutesInDay = 24 * 60;

  const blocks = useMemo(() => {
    if (!dayStart) {
      return [] as Array<{
        id: string;
        leftPct: number;
        widthPct: number;
        title: string;
        label: string;
        isHighlighted: boolean;
      }>;
    }

    const list: Array<{
      id: string;
      leftPct: number;
      widthPct: number;
      title: string;
      label: string;
      isHighlighted: boolean;
    }> = [];
    for (const r of items) {
      const start = new Date(r.startAt);
      const end = new Date(r.endAt);
      if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) continue;

      const startMinRaw = (start.getTime() - dayStart.getTime()) / 60000;
      const endMinRaw = (end.getTime() - dayStart.getTime()) / 60000;
      if (!Number.isFinite(startMinRaw) || !Number.isFinite(endMinRaw)) continue;

      const startMin = Math.max(0, Math.min(minutesInDay, startMinRaw));
      const endMin = Math.max(0, Math.min(minutesInDay, endMinRaw));
      const dur = endMin - startMin;
      if (!Number.isFinite(dur) || dur <= 0) continue;

      const leftPct = (startMin / minutesInDay) * 100;
      const widthPct = Math.max((dur / minutesInDay) * 100, 0.5);

      list.push({
        id: r.id,
        leftPct,
        widthPct,
        title: `${r.personName} — ${formatLocal(r.startAt)} → ${formatLocal(r.endAt)}`,
        label: r.personName,
        isHighlighted: r.id === highlightReservationId,
      });
    }
    return list;
  }, [dayStart, items, highlightReservationId]);

  return (
    <div className="grid gap-1">
      <div className="flex justify-between text-[10px] text-slate-500">
        {(() => {
          const base = dayStart ?? new Date();
          const labels = [0, 6, 12, 18, 24].map((h) => {
            const d = new Date(base.getTime());
            d.setHours(h, 0, 0, 0);
            return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
          });
          return labels.map((t, idx) => <span key={`${t}-${idx}`}>{t}</span>);
        })()}
      </div>

      <div className="relative h-10 w-full overflow-hidden rounded border bg-slate-50">
        {[0, 6, 12, 18, 24].map((h) => {
          const leftPct = (h / 24) * 100;
          return (
            <div key={h} className="pointer-events-none absolute inset-y-0" style={{ left: `${leftPct}%` }}>
              <div className="h-full w-px bg-slate-200" />
            </div>
          );
        })}

        {blocks.map((b) => (
          <div
            key={b.id}
            title={b.title}
            className={`absolute inset-y-1 overflow-hidden rounded border px-1 text-[10px] text-slate-900 ${
              b.isHighlighted
                ? "border-slate-900 bg-red-500/55 outline outline-2 outline-black"
                : "border-red-700 bg-red-500/40"
            }`}
            style={{ left: `${b.leftPct}%`, width: `${b.widthPct}%` }}
          >
            <div className="truncate">{b.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
