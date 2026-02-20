## 1. Project Setup

- [ ] 1.1 Select implementation stack consistent with design (UI client + API + relational DB)
- [ ] 1.2 Scaffold the web application and API structure
- [ ] 1.3 Add baseline tooling (formatting/linting, env var handling, basic error handling)
- [ ] 1.4 Add a local development README (run, configure shared credentials)

## 2. Persistence & Data Model

- [ ] 2.1 Define database schema for Layout, Desk, Personnel, Reservation, and session/auth state
- [ ] 2.2 Implement migrations/initialization for local development
- [ ] 2.3 Implement repository/data-access layer for Personnel, Desk, Layout, Reservation

## 3. Authentication (Shared Account)

- [ ] 3.1 Implement login endpoint/page for the configured shared credentials
- [ ] 3.2 Implement session creation and secure session storage
- [ ] 3.3 Add auth middleware/guards so protected routes reject unauthenticated requests
- [ ] 3.4 Implement logout to terminate the session

## 4. Personnel Directory

- [ ] 4.1 Implement API to list active personnel
- [ ] 4.2 Implement API to create/update personnel records
- [ ] 4.3 Implement API to deactivate personnel records
- [ ] 4.4 Build UI to manage personnel and verify deactivated personnel are not selectable for new reservations

## 5. Office Map Assets

- [ ] 5.1 Implement upload and retrieval for the base office layout image
- [ ] 5.2 Implement upload and retrieval for the optional reference (highlight) image
- [ ] 5.3 Build UI to display the current base layout image

## 6. Desk Management (Map Overlays)

- [ ] 6.1 Implement API to create desks with label and normalized geometry
- [ ] 6.2 Implement API to update desk label/geometry
- [ ] 6.3 Implement API to disable and delete desks
- [ ] 6.4 Build admin UI to place/edit desk overlays on the map (click/drag + resize handles as needed)
- [ ] 6.5 Ensure disabled desks cannot be reserved and are excluded from reservation selection

## 7. Reservations

- [ ] 7.1 Implement API to compute desk availability for a selected start/end time range
- [ ] 7.2 Implement API to create reservations with desk, person, and startAt/endAt validation
- [ ] 7.3 Implement conflict detection to reject overlapping reservations for the same desk
- [ ] 7.4 Implement API to cancel reservations
- [ ] 7.5 Implement API to edit reservations (person assignment and/or time range), respecting conflict rules
- [ ] 7.6 Build reservation UI flow: select time range, click/tap desk, pick person from dropdown, confirm
- [ ] 7.7 Render reserved desks as reserved on the map and show reserver name on hover/click

## 8. Verification

- [ ] 8.1 Add tests for reservation interval validation and overlap conflict rules
- [ ] 8.2 Add tests for authentication guard behavior (reject unauthenticated requests)
- [ ] 8.3 Add smoke test checklist for the end-to-end flow (upload map → create desks → reserve → cancel/edit)

## 9. Documentation

- [ ] 9.1 Document admin workflows (upload layout(s), define desks, manage personnel)
- [ ] 9.2 Document reservation workflows (availability, reserve, cancel/edit)
- [ ] 9.3 Document the post-MVP roadmap item: split shared account into Admin/User roles
