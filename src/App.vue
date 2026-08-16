<script setup>
import { onMounted, onUnmounted, reactive } from 'vue'
import PlayScreen from './components/PlayScreen.vue'
import OverlayScreen from './components/OverlayScreen.vue'
import { createGame, tap, tick } from './lib/game.js'

const game = reactive(createGame({ seed: Date.now() % 1_000_000 }))

let raf = 0
let last = 0

function frame(ts) {
  if (!last) last = ts
  const dt = Math.min(0.05, (ts - last) / 1000)
  last = ts
  tick(game, dt)
  raf = window.requestAnimationFrame(frame)
}

onMounted(() => {
  raf = window.requestAnimationFrame(frame)
})

onUnmounted(() => {
  window.cancelAnimationFrame(raf)
})

function onTap() {
  tap(game)
}
</script>

<template>
  <div class="shell">
    <PlayScreen :game="game" @tap="onTap" />
    <OverlayScreen
      v-if="game.screen !== 'play'"
      :game="game"
      @tap="onTap"
    />
  </div>
</template>

<style scoped>
.shell {
  position: relative;
  width: min(100vw, 430px);
  height: 100dvh;
  height: 100svh;
  overflow: hidden;
  background: #08090d;
  box-shadow: 0 0 0 1px #1c1e26;
}
</style>
