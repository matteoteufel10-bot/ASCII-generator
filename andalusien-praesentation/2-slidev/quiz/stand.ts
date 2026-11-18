import { reactive } from 'vue'

// Gemeinsamer Spielstand für alle Quiz-Runden.
// Gezählt wird, ob die Klasse beim ERSTEN Tipp richtig lag.
export const stand = reactive<{ runden: Record<string, boolean> }>({
  runden: {},
})

export function tippAbgeben(runde: string, richtig: boolean) {
  if (!(runde in stand.runden))
    stand.runden[runde] = richtig
}

export function zuruecksetzen() {
  stand.runden = {}
}
