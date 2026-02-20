import { OfficeMapPreview } from "@/components/OfficeMapPreview";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Desk Reservation (MVP)</h1>
        <p className="text-sm text-slate-600">
          Office layout preview (base image + optional desk reference overlay).
        </p>
      </header>

      <OfficeMapPreview
        baseSrc="/so-office-layout/so-office-layout-desks.png"
        referenceSrc="/so-office-layout/so-office-layout.png"
      />
    </main>
  );
}
