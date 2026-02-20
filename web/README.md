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

- `SHARED_USERNAME`
- `SHARED_PASSWORD`
- `SESSION_PASSWORD`

### 3) Run the dev server

```bash
npm.cmd --prefix web run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Office layout images

The current office layout assets are served from:

- `web/public/so-office-layout/so-office-layout.png`
- `web/public/so-office-layout/so-office-layout-desks.png`

The home page uses `so-office-layout-desks.png` as the primary visual and provides a toggle to overlay the original `so-office-layout.png`.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Formatting

```powershell
npm.cmd --prefix web run format
```
