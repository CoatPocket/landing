<script setup>
import { computed } from 'vue'
import { isInHitWindow, pulseHeight, pulsePhase } from '../lib/game.js'

const props = defineProps({
  game: { type: Object, required: true },
})

const emit = defineEmits(['tap'])

const phase = computed(() => pulsePhase(props.game.pulse))
const height = computed(() => pulseHeight(props.game.pulse))
const hot = computed(() => isInHitWindow(props.game.pulse))

const LANDING_BOTTOM = 24
const TOP_BOTTOM = 84

const pulseStyle = computed(() => {
  const y = height.value
  const bottom = LANDING_BOTTOM + 4 + y * (TOP_BOTTOM - LANDING_BOTTOM)
  const scale = 1 - y * 0.42
  return {
    bottom: `${bottom}%`,
    transform: `translateX(-50%) scale(${scale})`,
  }
})

const slabs = computed(() => {
  const floor = props.game.floor
  const max = props.game.building.landings
  const out = []
  for (let i = 0; i < 6; i++) {
    const n = floor + i
    if (n > max) break
    out.push({
      key: n,
      offset: i,
      current: i === 0,
      bottom: LANDING_BOTTOM + i * 10.2,
      width: 88 - i * 7.5,
      opacity: Math.max(0.18, 1 - i * 0.16),
    })
  }
  return out
})

const cue = computed(() => {
  if (props.game.screen !== 'play') return ''
  if (!props.game.pulse) return 'TAP TO SHOUT'
  if (hot.value) return 'STEP'
  if (phase.value === 'up') return 'UP'
  if (phase.value === 'down') return 'COMING'
  return ''
})

const falling = computed(() => props.game.lastResult === 'early' && props.game.screen === 'miss')

function onPointer(ev) {
  ev.preventDefault()
  if (props.game.screen !== 'play') return
  emit('tap')
}
</script>

<template>
  <div class="play" @pointerdown="onPointer">
    <header class="hud">
      <div class="floor-block">
        <p class="kicker">{{ game.building.name.toUpperCase() }}</p>
        <p class="floor">{{ game.floor }}</p>
      </div>
      <div class="hud-right">
        <div class="misses" aria-label="misses">
          <span
            v-for="i in game.maxMisses"
            :key="i"
            class="pip"
            :class="{ filled: i <= game.misses }"
          />
        </div>
        <p class="sit">{{ game.buildingsCleared + 1 }}/{{ game.sittingLength }}</p>
      </div>
    </header>

    <div class="shaft">
      <div class="darkness" />
      <div class="wall left" />
      <div class="wall right" />
      <div class="rail left" />
      <div class="rail right" />

      <div
        v-for="slab in slabs"
        :key="slab.key"
        class="slab"
        :class="{ current: slab.current, hot: slab.current && hot }"
        :style="{
          bottom: slab.bottom + '%',
          width: slab.width + '%',
          opacity: slab.opacity,
        }"
      >
        <span class="slab-num">{{ slab.key }}</span>
      </div>

      <div
        v-if="game.pulse"
        class="pulse"
        :class="[phase, { hot }]"
        :style="pulseStyle"
      >
        <span class="ring" />
        <span class="core" />
      </div>

      <div class="you" :class="{ fall: falling, ready: hot }">
        <span class="head" />
        <span class="torso" />
        <span class="leg l" />
        <span class="leg r" />
      </div>
    </div>

    <p class="cue" :class="{ hot }">{{ cue }}</p>
  </div>
</template>

<style scoped>
.play {
  position: absolute;
  inset: 0;
  cursor: pointer;
  touch-action: manipulation;
  background:
    linear-gradient(180deg, #0a0b10 0%, #10131b 42%, #0c0d12 100%);
}

.hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 4;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: calc(14px + env(safe-area-inset-top)) 20px 0;
}

.kicker {
  margin: 0;
  font-size: 10px;
  letter-spacing: 0.28em;
  color: #8a8490;
}

.floor {
  margin: 2px 0 0;
  font-size: 44px;
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 0.9;
  color: #f4efe6;
}

.hud-right {
  text-align: right;
}

.misses {
  display: flex;
  gap: 7px;
  justify-content: flex-end;
  margin-top: 8px;
}

.pip {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1.5px solid #4a4450;
  background: transparent;
}

.pip.filled {
  background: #e85d4c;
  border-color: #e85d4c;
  box-shadow: 0 0 8px #e85d4c;
}

.sit {
  margin: 8px 0 0;
  font-size: 11px;
  letter-spacing: 0.16em;
  color: #5c5664;
}

.shaft {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.darkness {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 28%;
  background: linear-gradient(180deg, #05060a 0%, transparent 100%);
  pointer-events: none;
  z-index: 3;
}

.wall {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 11%;
  background: linear-gradient(180deg, #161821 0%, #0e1016 100%);
}

.wall.left { left: 0; border-right: 1px solid #222633; }
.wall.right { right: 0; border-left: 1px solid #222633; }

.rail {
  position: absolute;
  top: 18%;
  bottom: 18%;
  width: 2px;
  background: linear-gradient(180deg, transparent, #3a3f52 20%, #3a3f52 80%, transparent);
  opacity: 0.55;
}

.rail.left { left: 16%; }
.rail.right { right: 16%; }

.slab {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  height: 10px;
  border-radius: 2px;
  background: linear-gradient(180deg, #3a3f52 0%, #232734 100%);
  box-shadow: 0 6px 0 #151821;
}

.slab.current {
  height: 14px;
  background: linear-gradient(180deg, #4a5168 0%, #2a2f40 100%);
  box-shadow: 0 8px 0 #12141c, 0 0 0 1px #5a6178;
}

.slab.hot {
  background: linear-gradient(180deg, #d4b86a 0%, #8a6e32 100%);
  box-shadow: 0 8px 0 #3a2e14, 0 0 22px 4px rgba(255, 210, 90, 0.45);
}

.slab-num {
  position: absolute;
  right: 10px;
  top: -16px;
  font-size: 10px;
  letter-spacing: 0.08em;
  color: #6a6574;
}

.slab.current .slab-num { color: #c8c2b4; }

.pulse {
  position: absolute;
  left: 50%;
  width: 72px;
  height: 72px;
  z-index: 2;
  pointer-events: none;
}

.ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 5px solid #ffe27a;
  box-shadow:
    0 0 16px 4px rgba(255, 210, 90, 0.75),
    0 0 48px 14px rgba(255, 180, 60, 0.35),
    inset 0 0 12px rgba(255, 246, 208, 0.4);
}

.core {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: #fff6d0;
  box-shadow: 0 0 10px 4px rgba(255, 246, 208, 0.8);
}

.pulse.up .ring {
  border-color: #ffe27a;
}

.pulse.down .ring {
  border-color: #fff1b0;
}

.pulse.hot .ring,
.pulse.landing .ring {
  border-color: #fff8d8;
  border-width: 6px;
  box-shadow:
    0 0 24px 8px rgba(255, 220, 120, 0.9),
    0 0 64px 22px rgba(255, 190, 70, 0.4);
  animation: bloom 0.2s ease-in-out infinite alternate;
}

.pulse.hot .core {
  width: 18px;
  height: 18px;
  background: #fff;
}

@keyframes bloom {
  from { transform: scale(1); }
  to { transform: scale(1.12); }
}

.you {
  position: absolute;
  left: 50%;
  bottom: 26.2%;
  width: 22px;
  height: 46px;
  transform: translateX(-50%);
  z-index: 2;
}

.you.ready {
  filter: drop-shadow(0 0 8px rgba(255, 226, 122, 0.7));
}

.you.fall {
  animation: fall 0.42s ease-in forwards;
}

@keyframes fall {
  to {
    transform: translate(-50%, 140%) rotate(16deg);
    opacity: 0;
  }
}

.head {
  position: absolute;
  left: 50%;
  top: 0;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transform: translateX(-50%);
  background: #e8e0d0;
}

.torso {
  position: absolute;
  left: 50%;
  top: 13px;
  width: 10px;
  height: 16px;
  border-radius: 3px;
  transform: translateX(-50%);
  background: #d4cdc0;
}

.leg {
  position: absolute;
  top: 28px;
  width: 4px;
  height: 16px;
  border-radius: 2px;
  background: #b8b1a4;
}

.leg.l { left: 5px; transform: rotate(8deg); }
.leg.r { right: 5px; transform: rotate(-8deg); }

.cue {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(18px + env(safe-area-inset-bottom));
  z-index: 4;
  margin: 0;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.32em;
  color: #7a7480;
}

.cue.hot {
  color: #ffe27a;
  text-shadow: 0 0 12px rgba(255, 210, 90, 0.6);
}
</style>
