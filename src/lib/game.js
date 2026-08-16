/** LANDING — you shout, the building shouts back, you climb on the reply. */

export const MAX_MISSES = 3
export const SITTING_MIN = 8
export const SITTING_MAX = 12
export const ROOF_BREATH = 10
export const PLAYABLE_BUILDING = 'apartment'

/**
 * Delay-curve table for four stairwell reskins.
 * v1 ships apartment as the only playable building.
 * delay is one-way travel time in ms; echo arrives at 2 * delay.
 * first* windows apply on floors 1–3; later* on the remaining floors.
 */
export const BUILDINGS = {
  'car-park': {
    id: 'car-park',
    name: 'Car Park',
    landings: 8,
    delayBase: 520,
    delayPerFloor: 70,
    firstEarly: 200,
    firstLate: 200,
    laterEarly: 90,
    laterLate: 90,
  },
  apartment: {
    id: 'apartment',
    name: 'Apartment',
    landings: 9,
    delayBase: 800,
    delayPerFloor: 110,
    firstEarly: 240,
    firstLate: 240,
    laterEarly: 110,
    laterLate: 110,
  },
  'multi-storey': {
    id: 'multi-storey',
    name: 'Multi-storey',
    landings: 10,
    delayBase: 1100,
    delayPerFloor: 150,
    firstEarly: 220,
    firstLate: 220,
    laterEarly: 90,
    laterLate: 90,
  },
  hotel: {
    id: 'hotel',
    name: 'Hotel Atrium',
    landings: 9,
    delayBase: 900,
    delayPerFloor: 120,
    firstEarly: 280,
    firstLate: 300,
    laterEarly: 160,
    laterLate: 180,
  },
}

function mulberry32(seed) {
  let s = seed >>> 0
  return () => {
    s += 0x6d2b79f5
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function delayForFloor(building, floor) {
  const f = Math.max(1, Math.floor(floor))
  return building.delayBase + building.delayPerFloor * (f - 1)
}

export function windowForFloor(building, floor) {
  const generous = floor <= 3
  return {
    early: generous ? building.firstEarly : building.laterEarly,
    late: generous ? building.firstLate : building.laterLate,
  }
}

export function windowWidth(building, floor) {
  const w = windowForFloor(building, floor)
  return w.early + w.late
}

export function pulsePhase(pulse) {
  if (!pulse) return null
  if (pulse.elapsed < pulse.delay) return 'up'
  const landStart = Math.max(pulse.delay, pulse.arrival - pulse.windowEarly)
  if (pulse.elapsed < landStart) return 'down'
  if (pulse.elapsed <= pulse.arrival + pulse.windowLate) return 'landing'
  return 'dead'
}

export function isInHitWindow(pulse) {
  return pulsePhase(pulse) === 'landing'
}

/** 0 at your landing, 1 at the top of the shaft. Linear so the ring is glanceable. */
export function pulseHeight(pulse) {
  if (!pulse) return 0
  const t = pulse.elapsed
  const d = pulse.delay
  if (t <= 0 || t >= 2 * d) return 0
  if (t <= d) return t / d
  return 1 - (t - d) / d
}

export function createGame(opts = {}) {
  const rng = mulberry32(opts.seed ?? 1)
  const sittingLength =
    opts.sittingLength ??
    SITTING_MIN + Math.floor(rng() * (SITTING_MAX - SITTING_MIN + 1))
  const buildingId = opts.buildingId ?? PLAYABLE_BUILDING
  const building = BUILDINGS[buildingId]
  if (!building) throw new Error(`unknown building: ${buildingId}`)

  return {
    screen: 'title',
    buildingId: building.id,
    building,
    floor: 1,
    misses: 0,
    maxMisses: MAX_MISSES,
    pulse: null,
    shoutCount: 0,
    lastResult: null,
    buildingOver: false,
    buildingsCleared: 0,
    sittingLength,
    roofLeft: 0,
    roofDuration: opts.roofDuration ?? ROOF_BREATH,
    playableBuildings: [PLAYABLE_BUILDING],
  }
}

export function startPlay(game) {
  game.screen = 'play'
  game.floor = 1
  game.misses = 0
  game.pulse = null
  game.lastResult = null
  game.buildingOver = false
  game.roofLeft = 0
}

function makePulse(game) {
  const delay = delayForFloor(game.building, game.floor)
  const win = windowForFloor(game.building, game.floor)
  game.shoutCount += 1
  return {
    id: game.shoutCount,
    elapsed: 0,
    delay,
    arrival: delay * 2,
    windowEarly: win.early,
    windowLate: win.late,
  }
}

/** One pulse at a time. Returns false if a shout is already in flight. */
export function shout(game) {
  if (game.screen !== 'play') return false
  if (game.pulse) return false
  game.pulse = makePulse(game)
  game.lastResult = 'shout'
  return true
}

function registerMiss(game, reason) {
  game.misses += 1
  game.pulse = null
  game.lastResult = reason
  if (game.misses >= game.maxMisses) {
    game.buildingOver = true
  }
  game.screen = 'miss'
}

function clearBuilding(game) {
  game.pulse = null
  game.lastResult = 'roof'
  game.buildingsCleared += 1
  game.screen = 'roof'
  game.roofLeft = game.roofDuration
}

function stepUp(game) {
  game.pulse = null
  game.lastResult = 'step'
  if (game.floor >= game.building.landings) {
    clearBuilding(game)
    return
  }
  game.floor += 1
}

function playTap(game) {
  if (!game.pulse) {
    shout(game)
    return 'shout'
  }
  if (isInHitWindow(game.pulse)) {
    stepUp(game)
    return 'step'
  }
  registerMiss(game, 'early')
  return 'early'
}

export function retry(game) {
  if (game.buildingOver) {
    game.floor = 1
    game.misses = 0
    game.buildingOver = false
  }
  game.pulse = null
  game.lastResult = null
  game.screen = 'play'
}

export function advanceFromRoof(game) {
  if (game.buildingsCleared >= game.sittingLength) {
    game.screen = 'sitting-done'
    game.pulse = null
    return
  }
  const nextId = game.playableBuildings[0] ?? PLAYABLE_BUILDING
  game.buildingId = nextId
  game.building = BUILDINGS[nextId]
  startPlay(game)
}

export function restartSitting(game) {
  const keptLength = game.sittingLength
  const next = createGame({
    seed: (game.shoutCount + 17) >>> 0,
    sittingLength: keptLength,
    buildingId: PLAYABLE_BUILDING,
    roofDuration: game.roofDuration,
  })
  Object.assign(game, next)
}

export function tap(game) {
  switch (game.screen) {
    case 'title':
      startPlay(game)
      shout(game)
      return 'shout'
    case 'play':
      return playTap(game)
    case 'miss':
      retry(game)
      return 'retry'
    case 'roof':
      advanceFromRoof(game)
      return 'next'
    case 'sitting-done':
      restartSitting(game)
      return 'restart'
    default:
      return null
  }
}

export function tick(game, dtSeconds) {
  const dt = Math.max(0, dtSeconds)
  if (game.screen === 'roof') {
    game.roofLeft = Math.max(0, game.roofLeft - dt)
    return
  }
  if (game.screen !== 'play' || !game.pulse) return
  game.pulse.elapsed += dt * 1000
  if (pulsePhase(game.pulse) === 'dead') {
    registerMiss(game, 'late')
  }
}
