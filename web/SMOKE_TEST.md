# Smoke test checklist (MVP)

This checklist is meant to quickly validate the end-to-end MVP flow:

- office map upload
- desk placement
- personnel setup
- reservation create + conflict detection + cancel/edit

## Prereqs

- In a PowerShell where `npm.ps1` is blocked, use `npm.cmd`.
- Create `web/.env.local` (copy from `web/.env.example`).
- Ensure `SESSION_PASSWORD` is at least 32 characters.

## Steps

### 1) Start the app

- `npm.cmd --prefix web install`
- `npm.cmd --prefix web run dev`
- Open `http://localhost:3000`

### 2) Create the first Admin

- Visit `http://localhost:3000/setup`
- Create the initial admin account
- Verify: you are redirected to `/` and are logged in

### 3) Upload the office layout image

- Visit `http://localhost:3000/admin/layout`
- Upload a base layout image (recommended: `so-office-layout.png`)
- (Optional) upload a highlight/reference overlay image (recommended: `so-office-layout-desks.png`)
- Verify: the home page shows the uploaded base layout

### 4) Create desks and verify public map

- Visit `http://localhost:3000/admin/desks`
- Add a few desks; drag/resize them to align with the map
- Verify: `http://localhost:3000/` shows the same desks clickable on the map

### 5) Create personnel

- Visit `http://localhost:3000/admin/personnel`
- Add 1–2 personnel records
- Verify: deactivated personnel do not appear in reservation dropdowns

### 6) Make a reservation

- On `http://localhost:3000/`:
  - pick a start/end date/time range
  - click an available desk
  - (Admin) pick a person from the dropdown
  - click Reserve
- Verify:
  - the desk becomes reserved for that time range
  - the reserver name is visible on hover/click

### 7) Conflict detection

- Try to reserve the same desk for an overlapping time range
- Verify: the reservation is rejected (conflict)

### 8) Cancel/edit

- As Admin, cancel the reservation
- Verify: the desk becomes available again

### 9) Disabled desks cannot be reserved

- Visit `http://localhost:3000/admin/desks`
- Disable a desk
- Verify:
  - it does not appear on the public map desk selection
  - it cannot be reserved via API (should be rejected)
