<script setup>
import { computed } from 'vue'

const props = defineProps({
  game: { type: Object, required: true },
})

const emit = defineEmits(['tap'])

const kind = computed(() => props.game.screen)

const title = computed(() => {
  switch (kind.value) {
    case 'title':
      return 'LANDING'
    case 'miss':
      if (props.game.buildingOver) return 'SIT DOWN'
      if (props.game.lastResult === 'early') return 'YOU FELL'
      if (props.game.lastResult === 'late') return 'TOO LATE'
      return 'MISS'
    case 'roof':
      return 'THE ROOF'
    case 'sitting-done':
      return 'SITTING DONE'
    default:
      return ''
  }
})

const blurb = computed(() => {
  switch (kind.value) {
    case 'title':
      return 'You shout up the stairwell. The building shouts back. You climb on the reply.'
    case 'miss':
      if (props.game.buildingOver) return 'Three misses. The building is over. Instant retry.'
      if (props.game.lastResult === 'early') return 'You stepped into the gap.'
      return 'The echo died. You stayed put.'
    case 'roof':
      return `Building ${props.game.buildingsCleared} of ${props.game.sittingLength}. Look at the view.`
    case 'sitting-done':
      return `${props.game.sittingLength} buildings. The night holds. Tap again.`
    default:
      return ''
  }
})

const cta = computed(() => {
  switch (kind.value) {
    case 'title':
      return 'TAP TO SHOUT'
    case 'miss':
      return 'TAP TO RETRY'
    case 'roof':
      return 'TAP FOR NEXT'
    case 'sitting-done':
      return 'TAP AGAIN'
    default:
      return 'TAP'
  }
})

function onTap(ev) {
  ev.preventDefault()
  emit('tap')
}
</script>

<template>
  <button class="overlay" :class="kind" type="button" @pointerdown="onTap">
    <div class="panel">
      <p v-if="kind === 'title'" class="eyebrow">EMPTY BUILDING · LATE NIGHT</p>
      <h1>{{ title }}</h1>
      <p class="blurb">{{ blurb }}</p>
      <p class="cta">{{ cta }}</p>
    </div>
  </button>
</template>

<style scoped>
.overlay {
  position: absolute;
  inset: 0;
  z-index: 8;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px 28px 48px;
  cursor: pointer;
  touch-action: manipulation;
  background: rgba(6, 7, 10, 0.72);
  backdrop-filter: blur(6px);
}

.overlay.title {
  background: rgba(6, 7, 10, 0.82);
}

.overlay.miss {
  background: rgba(18, 6, 8, 0.78);
}

.overlay.roof {
  background: rgba(8, 10, 16, 0.55);
}

.panel {
  max-width: 320px;
  text-align: center;
}

.eyebrow {
  margin: 0 0 14px;
  font-size: 10px;
  letter-spacing: 0.34em;
  color: #8a8490;
}

h1 {
  margin: 0;
  font-size: clamp(42px, 14vw, 64px);
  font-weight: 800;
  letter-spacing: 0.18em;
  line-height: 0.95;
  color: #f4efe6;
}

.overlay.miss h1 {
  letter-spacing: 0.08em;
  color: #f0c8c2;
}

.overlay.roof h1 {
  letter-spacing: 0.14em;
  color: #e8e4d4;
}

.blurb {
  margin: 18px 0 0;
  font-size: 15px;
  line-height: 1.45;
  color: #b8b2a8;
}

.cta {
  margin: 28px 0 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.34em;
  color: #ffe27a;
  text-shadow: 0 0 14px rgba(255, 210, 90, 0.45);
}
</style>
