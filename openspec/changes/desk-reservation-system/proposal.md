## Why

Office desk availability is often tracked informally, leading to double-bookings, wasted time, and unclear ownership of desk assignments. A simple desk-reservation system with a map-based UI enables fast, self-service reservations while giving admins control over the floor plan and bookings.

## What Changes

- Add an office layout map view that shows desks and their availability for a selected date/time range.
- Add an interactive reservation flow: users click/tap a desk on the map, choose a person from an office personnel dropdown, select a date/time range (years → minutes), and confirm.
- Visually reflect reservation state on the map: reserved desks render in red and show the reserver’s name on hover/click.
- **Authentication:** Introduce secure per-user accounts (email + password). Passwords MUST be stored as secure hashes (never plaintext).
- **Roles:** Support two roles with separate login credentials:
  - **Admin**: full control over desk locations and all reservations (create/edit/delete/override) and manages user accounts.
  - **User**: can only reserve a desk for themselves and can hold at most one active reservation.
- Booking rules:
  - Users cannot reserve for someone else.
  - Users cannot cancel their own reservations.
  - Each user may have only one active reservation at a time.
- Add admin tooling to define which areas on the map are reservable desks.
  - Admin can upload a base layout plus a second layout highlighting bookable spots, or use an equivalent method that clearly identifies bookable desk locations on the map.

## Capabilities

### New Capabilities

- `auth-accounts`: Secure authentication for Admin/User accounts, admin-managed user provisioning, and session management.
- `office-map`: Display an office layout diagram and support admin-defined desk locations on the map.
- `desk-reservations`: View desk availability and create reservations via map interaction; enforce desk/time conflict rules and user restrictions (self-only, one active reservation per user, user cannot cancel).
- `admin-desk-management`: Admin CRUD for desks/locations and the ability to override, edit, or delete any reservation/desk assignment.
- `personnel-directory`: Maintain a list of office personnel for the reservation dropdown and associate reservations to personnel identities.

### Modified Capabilities

<!-- None (no existing specs yet). -->

## Impact

- Introduces persistent storage for users/personnel, desk locations, and reservations.
- Requires a UI that can render an office map and map desk locations to clickable/tappable regions.
- Adds authentication and establishes a path to role-based access control (Admin/User) in a later change.
- Adds authentication + role-based access control across desk management and reservation operations.
- Adds reservation conflict checking and rule enforcement (per-desk availability and per-user restrictions).
