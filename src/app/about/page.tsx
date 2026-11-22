import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StatusBadge, type Status } from "@/components/StatusBadge";
import { copy } from "@/copy/es-AR";

export const metadata: Metadata = { title: `${copy.about.eyebrow} · ${copy.appName}` };

const ORDER: Status[] = ["working", "simulated", "comingSoon"];

export default function AboutPage() {
  const { about } = copy;
  return (
    <article className="space-y-8">
      <Link href="/" className="btn btn-ghost -ml-3 text-sm text-muted">
        <ArrowLeft className="size-4" /> {about.back}
      </Link>
      <header className="space-y-3">
        <p className="eyebrow">{about.eyebrow}</p>
        <h1 className="font-serif text-4xl leading-tight tracking-tight">{about.title}</h1>
        <p className="max-w-prose text-muted">{about.intro}</p>
      </header>

      <section className="rounded-3xl bg-surface p-5 ring-1 ring-line">
        <h2 className="eyebrow mb-3">{about.legendTitle}</h2>
        <dl className="space-y-3 text-sm">
          {ORDER.map((s) => (
            <div key={s} className="flex items-start gap-3">
              <dt className="w-28 shrink-0"><StatusBadge status={s} /></dt>
              <dd className="text-muted">{about.legend[s]}</dd>
            </div>
          ))}
        </dl>
      </section>

      {ORDER.map((s) => (
        <section key={s} className="space-y-3">
          <h2 className="flex items-center gap-2 font-serif text-2xl">
            {copy.status[s]} <StatusBadge status={s} />
          </h2>
          <ul className="divide-y divide-line overflow-hidden rounded-3xl bg-surface ring-1 ring-line">
            {about.capabilities.filter((c) => c.status === s).map((c) => (
              <li key={c.name} className="p-4">
                <p className="font-medium">{c.name}</p>
                <p className="mt-0.5 text-sm text-muted">{c.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="space-y-2">
        <h2 className="font-serif text-2xl">{about.privacyTitle}</h2>
        <p className="max-w-prose text-sm text-muted">{about.privacy}</p>
      </section>
    </article>
  );
}
