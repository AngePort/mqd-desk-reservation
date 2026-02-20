## Context

This change introduces a desk-reservation system for an office environment. The core UX is map-based: employees click/tap on desks in an office layout diagram to view availability and create reservations. Admins define which desk locations are bookable directly on the map.

The current repository contains only OpenSpec artifacts (no established application framework yet), so this design proposes a pragmatic, minimal architecture that can evolve into a role-based system (Admin/User) later.

Key constraints from the proposal:
- Interactive office map with clickable/tappable desks.
- Reservation creation includes selecting a person from an office personnel dropdown and selecting a start/end time (years → minutes).
- Reserved desks are shown in red and display the reserver’s name on hover/click.
- MVP authentication is a single shared account with full permissions; Admin/User role split is post-MVP.

## Goals / Non-Goals

**Goals:**
- Provide a web UI that renders an office layout image and overlays bookable desk locations.
- Provide an admin workflow to create/edit/delete desk locations anchored on the layout.
- Provide reservation CRUD with correct conflict detection per desk/time range.
- Persist office layout(s), desk definitions, personnel list, and reservations.
- Implement MVP authentication as a single shared login with full permissions.
- Keep the data model and API boundaries compatible with a future Admin/User split.

**Non-Goals:**
- Implementing end-user self-service accounts in the MVP (unique user logins).
- Enforcing post-MVP user restrictions (self-only reservations, one active reservation per user, user cannot cancel).
- Advanced map features (multi-floor navigation, zoom/pan polish beyond basic usability, automatic desk detection from images).
- Integrations (SSO, HR directories, calendar sync).

## Decisions

### Use a simple web app with a small API + database
**Decision:** Implement as a standard web application with a UI client, a server API, and a relational database.

**Rationale:** This cleanly supports persistence, conflict checking, and admin tooling. It also provides a natural place to add RBAC later.

**Alternatives considered:**
- Fully client-side app with localStorage: rejected due to multi-user concurrency and auditability.
- Spreadsheet-style booking: rejected because the primary requirement is a map-based UI.

### Office map representation: image background + desk overlay primitives
**Decision:** Store an office layout as an image (PNG/JPG/SVG) and represent each bookable desk location as an overlay “desk marker” with geometry in layout coordinates.

- Desk geometry: start with rectangles (x, y, width, height) in normalized coordinates (0..1) relative to the image; allow later extension to polygons.
- Desk metadata: desk label/name, optional notes, enabled/disabled.

**Rationale:** Normalized coordinates are resilient to different screen sizes and image scaling.

**Alternatives considered:**
- Parsing a “highlighted” image to auto-detect desks: rejected for MVP complexity and brittleness.

### Admin desk definition workflow: optional dual-image upload + click-to-place/edit
**Decision:** Provide an admin page where the admin uploads:
1) a base office layout image, and optionally
2) a second “reference” image that visually highlights bookable spots.

Admins then create desks by clicking/dragging on the map to place/edit desk rectangles. The highlighted image (if provided) is used only as a visual guide (no image processing required).

**Rationale:** Satisfies the requirement (“upload plain layout and second highlighted version, or equivalent”) while keeping the implementation straightforward and reliable.

### Reservation model: time ranges with overlap checks
**Decision:** Model reservations with `startAt` and `endAt` timestamps and enforce “no overlapping reservations for the same desk” at the API layer (and, if supported, via DB constraints/indexing strategies).

- Conflict rule (MVP): For a given desk, a new reservation is invalid if its interval overlaps an existing reservation interval.

**Rationale:** Explicit time ranges allow partial-day bookings and align with the UI requirement of selecting down to minutes.

**Alternatives considered:**
- Fixed time slots: rejected because the requirement calls for arbitrary time ranges.

### Identity model: personnel directory separate from authentication
**Decision:** Maintain a `Personnel` directory used for reservations and display, separate from the authentication mechanism.

- MVP: authenticated session represents the shared admin-style operator.
- Reservations reference a `personId` (from the directory).

**Rationale:** Keeps reservations tied to real people even before implementing per-user accounts; enables future user accounts to be linked to personnel records.

### Authorization: MVP “all permissions”, future RBAC
**Decision:** Implement a single authenticated role with full permissions for MVP. Keep API endpoints structured such that it’s straightforward to add authorization gates later (e.g., admin-only desk management, user-only “reserve for self”).

**Rationale:** Matches the requested short-term simplification without blocking future Admin/User role support.

## Risks / Trade-offs

- [Map alignment errors] Admin may place desk markers inaccurately → Provide snap-to-grid or simple resize handles; store normalized coordinates and offer preview mode.
- [Time zones and DST] Reservations can appear shifted → Store timestamps in UTC; display in office-local time zone; record the office time zone in settings.
- [Concurrency] Two operators could reserve the same desk at nearly the same time → Enforce conflicts server-side and return a clear “desk already reserved” error on race.
- [Future RBAC constraints] Post-MVP self-only rules might require additional account data → Ensure `Reservation` always references `personId`; later link authenticated user to a `personId`.
