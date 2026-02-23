## 1. Project Setup

- [x] 1.1 Select implementation stack consistent with design (UI client + API + relational DB)
- [x] 1.2 Scaffold the web application and API structure
- [x] 1.3 Add baseline tooling (formatting/linting, env var handling, basic error handling)
- [x] 1.4 Add a local development README (run, configure shared credentials)

## 2. Persistence & Data Model

- [x] 2.1 Define database schema for Layout, Desk, Personnel, Reservation, and session/auth state
- [x] 2.2 Implement migrations/initialization for local development
- [x] 2.3 Implement repository/data-access layer for Personnel, Desk, Layout, Reservation

## 3. Authentication (Shared Account)

## 3. Authentication & User Accounts

- [x] 3.1 Implement database-backed user accounts (Admin/User) with secure password hashing
- [x] 3.2 Implement login page/endpoint for email + password
- [x] 3.3 Implement session creation and secure session storage
- [x] 3.4 Add authorization guards for protected routes and admin-only operations
- [x] 3.5 Implement logout to terminate the session
- [x] 3.6 Build admin UI to create users and reset passwords

## 4. Personnel Directory

- [x] 4.1 Implement API to list active personnel
- [x] 4.2 Implement API to create/update personnel records
- [x] 4.3 Implement API to deactivate personnel records
- [x] 4.4 Build UI to manage personnel and verify deactivated personnel are not selectable for new reservations

## 5. Office Map Assets

- [x] 5.1 Implement upload and retrieval for the base office layout image
- [x] 5.2 Implement upload and retrieval for the optional reference (highlight) image
- [x] 5.3 Build UI to display the current base layout image

## 6. Desk Management (Map Overlays)

- [x] 6.1 Implement API to create desks with label and normalized geometry
- [x] 6.2 Implement API to update desk label/geometry
- [x] 6.3 Implement API to disable and delete desks
- [x] 6.4 Build admin UI to place/edit desk overlays on the map (click/drag + resize handles as needed)
- [x] 6.5 Ensure disabled desks cannot be reserved and are excluded from reservation selection

## 7. Reservations

- [x] 7.1 Implement API to compute desk availability for a selected start/end time range
- [x] 7.2 Implement API to create reservations with desk, person, and startAt/endAt validation
- [x] 7.3 Implement conflict detection to reject overlapping reservations for the same desk
- [x] 7.4 Implement API to cancel reservations
- [x] 7.5 Implement API to edit reservations (person assignment and/or time range), respecting conflict rules
- [x] 7.6 Build reservation UI flow: select time range, click/tap desk, pick person from dropdown, confirm
- [x] 7.7 Render reserved desks as reserved on the map and show reserver name on hover/click

## 8. Verification

- [x] 8.1 Add tests for reservation interval validation and overlap conflict rules
- [x] 8.2 Add tests for authentication guard behavior (reject unauthenticated requests)
- [x] 8.3 Add smoke test checklist for the end-to-end flow (upload map → create desks → reserve → cancel/edit)

## 9. Documentation

- [x] 9.1 Document admin workflows (upload layout(s), define desks, manage personnel)
- [x] 9.2 Document reservation workflows (availability, reserve, cancel/edit)
- [x] 9.3 Document the post-MVP roadmap item: split shared account into Admin/User roles
