<script setup lang="ts">
import { computed, ref } from 'vue'
import { tippAbgeben } from '../quiz/stand'

const props = withDefaults(defineProps<{
  runde: string
  bild: string
  // Ausschnitt: Zoomfaktor in % und Position des Ausschnitts
  zoom?: number
  pos?: string
  optionen: string[]
  antwort: string
  ort: string
  erklaerung: string
  quelle: string
  // wird von der Folie über $clicks gesetzt (Pfeiltaste = auflösen)
  aufgeloest?: boolean
}>(), {
  zoom: 300,
  pos: '50% 50%',
  aufgeloest: false,
})

const gewaehlt = ref<string[]>([])
const richtigGetippt = computed(() => gewaehlt.value.includes(props.antwort))
const offen = computed(() => props.aufgeloest || richtigGetippt.value)

function tippen(option: string, ev: MouseEvent) {
  // Fokus vom Button nehmen, sonst ignoriert Slidev die Pfeiltasten
  ;(ev.currentTarget as HTMLElement | null)?.blur()
  if (offen.value || gewaehlt.value.includes(option))
    return
  gewaehlt.value.push(option)
  tippAbgeben(props.runde, option === props.antwort)
}

function zustand(option: string) {
  if (offen.value && option === props.antwort)
    return 'richtig'
  if (gewaehlt.value.includes(option))
    return option === props.antwort ? 'richtig' : 'falsch'
  return ''
}

const bildStil = computed(() => ({
  backgroundImage: `url(${import.meta.env.BASE_URL}bilder/${props.bild})`,
  backgroundSize: offen.value ? 'cover' : `${props.zoom}%`,
  backgroundPosition: offen.value ? 'center' : props.pos,
}))
</script>

<template>
  <div class="quiz">
    <div class="quiz-bild-rahmen">
      <div class="quiz-bild" :class="{ offen }" :style="bildStil" />
      <div class="quiz-lupe" v-if="!offen">Ausschnitt · {{ Math.round(zoom / 100) }}× vergrößert</div>
      <div class="quiz-quelle" v-else>{{ quelle }}</div>
    </div>

    <div class="quiz-seite">
      <div class="quiz-frage">Was ist das?</div>
      <div class="quiz-optionen">
        <button
          v-for="(o, i) in optionen"
          :key="o"
          class="quiz-option"
          :class="zustand(o)"
          @click.stop="tippen(o, $event)"
        >
          <span class="buchstabe">{{ 'ABCD'[i] }}</span>{{ o }}
        </button>
      </div>

      <Transition name="aufloesung">
        <div v-if="offen" class="quiz-loesung">
          <div class="quiz-loesung-titel">{{ antwort }}</div>
          <div class="quiz-ort">{{ ort }}</div>
          <p>{{ erklaerung }}</p>
        </div>
        <div v-else class="quiz-hinweis">
          Tippt eine Antwort an. <kbd>→</kbd> löst auf.
        </div>
      </Transition>
    </div>
  </div>
</template>
