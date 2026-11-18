<script setup lang="ts">
import { computed } from 'vue'
import { stand, zuruecksetzen } from '../quiz/stand'

const props = defineProps<{ gesamt: number }>()
const richtig = computed(() => Object.values(stand.runden).filter(Boolean).length)
const gespielt = computed(() => Object.keys(stand.runden).length)
const urteil = computed(() => {
  if (gespielt.value === 0) return 'Noch keine Runde getippt.'
  const anteil = richtig.value / props.gesamt
  if (anteil >= 0.85) return 'Echte Al-Andalus-Profis!'
  if (anteil >= 0.5) return 'Stark, ihr erkennt die Spuren schon.'
  return 'Beim nächsten Spanien-Urlaub genau hinschauen!'
})
</script>

<template>
  <div class="ergebnis">
    <div class="ergebnis-zahl">{{ richtig }}<span> / {{ gesamt }}</span></div>
    <div class="ergebnis-text">beim ersten Tipp richtig · {{ urteil }}</div>
    <button class="ergebnis-reset" @click.stop="zuruecksetzen(); ($event.currentTarget as HTMLElement).blur()">Spielstand zurücksetzen</button>
  </div>
</template>
