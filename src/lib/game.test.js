import { describe, it, expect } from 'vitest'
import {
  BUILDINGS,
  MAX_MISSES,
  createGame,
  startPlay,
  tap,
  tick,
  shout,
  retry,
  delayForFloor,
  windowForFloor,
  windowWidth,
  pulsePhase,
  isInHitWindow,
} from './game.js'

function play(opts = {}) {
  const game = createGame({
    seed: 11,
    sittingLength: 10,
    buildingId: 'apartment',
    ...opts,
  })
  startPlay(game)
  return game
}

function shoutAndWaitForLanding(game) {
  tap(game)
  const delay = delayForFloor(game.building, game.floor)
  tick(game, (delay * 2) / 1000)
  return game
}

describe('shout starts a pulse going up', () => {
  it('first tap starts a shout / pulse going up', () => {
    const game = play()
    expect(game.pulse).toBe(null)
    const action = tap(game)
    expect(action).toBe('shout')
    expect(game.pulse).not.toBe(null)
    expect(pulsePhase(game.pulse)).toBe('up')
    expect(game.shoutCount).toBe(1)
    expect(game.pulse.elapsed).toBe(0)
  })
})

describe('pulse returns after the floor delay', () => {
  it('travels up for the delay, then comes back down onto the landing', () => {
    const game = play()
    tap(game)
    const delay = delayForFloor(game.building, game.floor)
    expect(game.pulse.delay).toBe(delay)
    expect(game.pulse.arrival).toBe(delay * 2)

    tick(game, delay / 1000)
    expect(pulsePhase(game.pulse)).toBe('down')
    expect(isInHitWindow(game.pulse)).toBe(false)

    tick(game, delay / 1000)
    expect(pulsePhase(game.pulse)).toBe('landing')
    expect(isInHitWindow(game.pulse)).toBe(true)
  })
})

describe('step on the echo', () => {
  it('tap in the hit window while echo is on the landing = step up, floor increments', () => {
    const game = play()
    expect(game.floor).toBe(1)
    shoutAndWaitForLanding(game)
    expect(isInHitWindow(game.pulse)).toBe(true)
    const action = tap(game)
    expect(action).toBe('step')
    expect(game.floor).toBe(2)
    expect(game.misses).toBe(0)
    expect(game.pulse).toBe(null)
    expect(game.screen).toBe('play')
  })
})

describe('early tap is a miss', () => {
  it('tap too early = miss, floor stays', () => {
    const game = play()
    tap(game)
    tick(game, 0.08)
    expect(pulsePhase(game.pulse)).toBe('up')
    const action = tap(game)
    expect(action).toBe('early')
    expect(game.misses).toBe(1)
    expect(game.floor).toBe(1)
    expect(game.pulse).toBe(null)
    expect(game.lastResult).toBe('early')
    expect(game.screen).toBe('miss')
    expect(game.buildingOver).toBe(false)
  })
})

describe('late miss — echo dies with no tap', () => {
  it('miss if the echo dies with no tap (late)', () => {
    const game = play()
    tap(game)
    const delay = delayForFloor(game.building, game.floor)
    const win = windowForFloor(game.building, game.floor)
    tick(game, (delay * 2 + win.late + 1) / 1000)
    expect(game.misses).toBe(1)
    expect(game.floor).toBe(1)
    expect(game.lastResult).toBe('late')
    expect(game.pulse).toBe(null)
    expect(game.screen).toBe('miss')
  })
})

describe('three misses end the building', () => {
  it('3 misses ends the building', () => {
    const game = play()
    for (let i = 0; i < MAX_MISSES; i++) {
      if (game.screen === 'miss') retry(game)
      tap(game)
      tick(game, 0.05)
      tap(game)
    }
    expect(game.misses).toBe(3)
    expect(game.buildingOver).toBe(true)
    expect(game.screen).toBe('miss')
    expect(game.floor).toBe(1)

    retry(game)
    expect(game.floor).toBe(1)
    expect(game.misses).toBe(0)
    expect(game.buildingOver).toBe(false)
    expect(game.screen).toBe('play')
  })
})

describe('delay grows with height', () => {
  it('delay is longer on a higher floor than floor 1', () => {
    const apt = BUILDINGS.apartment
    const d1 = delayForFloor(apt, 1)
    const dHigh = delayForFloor(apt, apt.landings)
    expect(dHigh).toBeGreaterThan(d1)
    expect(d1).toBe(apt.delayBase)

    const game = play()
    tap(game)
    expect(game.pulse.delay).toBe(d1)
    tick(game, (d1 * 2) / 1000)
    tap(game)
    expect(game.floor).toBe(2)
    tap(game)
    expect(game.pulse.delay).toBe(delayForFloor(apt, 2))
    expect(game.pulse.delay).toBeGreaterThan(d1)
  })
})

describe('hit window tightens after the first landings', () => {
  it('hit window is looser on floors 1–3 than on the last floors', () => {
    const apt = BUILDINGS.apartment
    const low = windowWidth(apt, 1)
    const mid = windowWidth(apt, 3)
    const last = windowWidth(apt, apt.landings)
    expect(low).toBe(mid)
    expect(low).toBeGreaterThan(last)
    expect(windowForFloor(apt, 1).early).toBeGreaterThan(windowForFloor(apt, apt.landings).early)
    expect(windowForFloor(apt, 4).early).toBe(apt.laterEarly)
  })
})

describe('one pulse at a time', () => {
  it('no shout while a pulse is already in flight', () => {
    const game = play()
    expect(shout(game)).toBe(true)
    const id = game.pulse.id
    const count = game.shoutCount
    expect(shout(game)).toBe(false)
    expect(game.pulse.id).toBe(id)
    expect(game.shoutCount).toBe(count)
    expect(pulsePhase(game.pulse)).toBe('up')

    tick(game, 0.2)
    const action = tap(game)
    expect(action).toBe('early')
    expect(game.shoutCount).toBe(count)
    expect(game.pulse).toBe(null)
  })
})

describe('title tap shouts', () => {
  it('title TAP TO SHOUT starts play and sends a pulse up', () => {
    const game = createGame({ seed: 3, sittingLength: 8 })
    expect(game.screen).toBe('title')
    expect(tap(game)).toBe('shout')
    expect(game.screen).toBe('play')
    expect(pulsePhase(game.pulse)).toBe('up')
  })
})

describe('roof and sitting', () => {
  it('clearing the last landing opens the roof, then sitting-done after enough buildings', () => {
    const game = play({ sittingLength: 2 })
    const landings = game.building.landings
    for (let floor = 1; floor <= landings; floor++) {
      expect(game.screen).toBe('play')
      shoutAndWaitForLanding(game)
      tap(game)
    }
    expect(game.screen).toBe('roof')
    expect(game.buildingsCleared).toBe(1)
    expect(game.roofLeft).toBe(game.roofDuration)

    tick(game, 3)
    expect(game.roofLeft).toBe(game.roofDuration - 3)

    tap(game)
    expect(game.screen).toBe('play')
    expect(game.floor).toBe(1)
    expect(game.misses).toBe(0)

    for (let floor = 1; floor <= landings; floor++) {
      shoutAndWaitForLanding(game)
      tap(game)
    }
    expect(game.screen).toBe('roof')
    expect(game.buildingsCleared).toBe(2)
    tap(game)
    expect(game.screen).toBe('sitting-done')

    tap(game)
    expect(game.screen).toBe('title')
    expect(game.buildingsCleared).toBe(0)
  })
})
