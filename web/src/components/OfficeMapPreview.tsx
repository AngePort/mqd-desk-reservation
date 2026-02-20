"use client";

import Image from "next/image";
import { useState } from "react";

type OfficeMapPreviewProps = {
  baseSrc: string;
  referenceSrc?: string;
};

export function OfficeMapPreview({ baseSrc, referenceSrc }: OfficeMapPreviewProps) {
  const [showReference, setShowReference] = useState(false);

  return (
    <section className="flex flex-col gap-3">
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
          Show original layout overlay
        </label>
      </div>

      <div className="w-full overflow-auto">
        <div className="relative inline-block">
          <Image
            src={baseSrc}
            alt="Office layout (primary)"
            width={1400}
            height={900}
            priority
            className="h-auto w-[min(1400px,100%)] select-none"
          />

          {referenceSrc && showReference ? (
            <Image
              src={referenceSrc}
              alt="Office layout (original overlay)"
              width={1400}
              height={900}
              className="pointer-events-none absolute inset-0 h-auto w-[min(1400px,100%)] select-none opacity-50"
            />
          ) : null}
        </div>
      </div>

      <p className="text-xs text-slate-600">
        Next step: define desk locations as clickable overlays aligned to this layout.
      </p>
    </section>
  );
}
