Desk reservation system (MVP) web app.

This folder contains a Next.js app used to build the map-based desk reservation UI.

## Getting Started

### 1) Install dependencies

From the repo root:

```powershell
npm.cmd --prefix web install
```

Note: In some Windows/PowerShell setups, `npm` resolves to `npm.ps1` which can be blocked by execution policy. Using `npm.cmd` avoids that.

### 2) Configure environment variables

Copy the example env file:

```powershell
Copy-Item web/.env.example web/.env.local
```

Edit `web/.env.local` and set:

- `DATABASE_URL`
- `SESSION_PASSWORD`

### 3) Create the first admin user

On first run, visit `/setup` to create the initial Admin account.

After an admin exists, `/setup` is disabled.

### 4) Run the dev server

```bash
npm.cmd --prefix web run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Office layout images

The current office layout assets are served from:

- `web/public/so-office-layout/so-office-layout.png`
- `web/public/so-office-layout/so-office-layout-desks.png`

For the MVP UI:

- The **base layout** is `so-office-layout.png`.
- The **optional reference overlay** is `so-office-layout-desks.png`.

Admins can upload a different base layout (and optional reference overlay) from `/admin/layout`.

## Admin workflows

### Upload layout assets

1. Go to `/admin/layout`.
2. Upload a base layout image (required).
3. Upload an optional reference/highlight image (optional).

The latest uploaded layout becomes the default map shown on the home page.

### Define desk overlays

1. Go to `/admin/desks`.
2. Click on the map to add a desk.
3. Drag to move; use resize handles to adjust size.
4. Disable desks that should not be reservable.

### Manage personnel

1. Go to `/admin/personnel`.
2. Create personnel records.
3. Deactivate personnel who should not be selectable for new reservations.

### Manage users

1. Go to `/admin/users`.
2. Create users (Admin or User role).
3. Reset passwords as needed.

## Reservation workflow

1. On `/`, pick a start/end time range.
2. Click an available desk on the map.
3. Choose the person:
	- **Users** can only reserve for themselves.
	- **Admins** can reserve on behalf of any active personnel.
4. Confirm the reservation.

Reserved desks render as reserved for the selected time range, and the reserver name is shown on hover/click.

## Verification

- Smoke test: see `web/SMOKE_TEST.md`

## Tests

```powershell
npm.cmd --prefix web test
```

## Roadmap (post-MVP)

- Replace the “admin provisions accounts” approach with an invite flow or SSO.
- Add user self-service password resets and audit logging for admin actions.
- Expand role/permission model beyond the current Admin/User split as needed.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Formatting

```powershell
npm.cmd --prefix web run format
```
