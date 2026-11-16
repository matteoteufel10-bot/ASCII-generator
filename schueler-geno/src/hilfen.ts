// Kleine Hilfsfunktionen, die auf mehreren Seiten gebraucht werden.

/** Baut einen internen Link, der auch in einem Unterordner (GitHub Pages) funktioniert. */
export function link(pfad: string): string {
  const basis = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${basis}/${pfad.replace(/^\//, '')}`;
}

const datumsFormat = new Intl.DateTimeFormat('de-DE', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/** 2026-11-10 -> "10. November 2026" */
export function datumLesbar(datum: Date): string {
  return datumsFormat.format(datum);
}

/** 2026-11-10 -> "2026-11-10" (maschinenlesbar) */
export function datumIso(datum: Date): string {
  return datum.toISOString().slice(0, 10);
}
