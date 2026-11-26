// Real-browser tests. Opt-in: set CHROME_PATH to a Chromium-based binary and run `npm run test:e2e`.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { chromium } from 'playwright-core'
import { createServer } from '../server/index.js'
import RoomManager from '../server/RoomManager.js'

const CHROME = process.env.CHROME_PATH
const skip = CHROME ? false : 'set CHROME_PATH to run'

const { server, io } = createServer({ rooms: new RoomManager({ graceMs: 60_000 }) })
let base
let browser

before(async () => {
  await new Promise(resolve => server.listen(0, resolve))
  base = `http://localhost:${server.address().port}`
  if (!skip) browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] })
})

after(async () => {
  await browser?.close()
  io.close()
  server.close()
})

// Every page records JS errors and failed HTTP responses, so a 404 fails the test
async function openPage (ctx) {
  const page = await ctx.newPage()
  page.problems = []
  page.on('pageerror', e => page.problems.push(`js: ${e.message}`))
  page.on('console', m => { if (m.type() === 'error') page.problems.push(`console: ${m.text()}`) })
  page.on('response', r => { if (r.status() >= 400) page.problems.push(`http ${r.status()}: ${r.url()}`) })
  await page.goto(base)
  return page
}

const myTurnLabel = page => page.locator('p[role="status"]', { hasText: /^\s*Sua vez/ })

// Returns the page whose turn it is, after the board has rendered
async function pageOnTurn (pages) {
  for (let i = 0; i < 100; i++) {
    for (const p of pages) {
      if (await myTurnLabel(p).count()) return p
    }
    await new Promise(r => setTimeout(r, 50))
  }
  throw new Error('no page is on turn')
}

async function createRoom (host, name, capacity) {
  await host.locator('input[placeholder="Seu nome"]').fill(name)
  await host.getByRole('button', { name: `Nova sala (${capacity} jogadores)` }).click()
  await host.locator('text=Código da sala').waitFor()
  return (await host.locator('strong').first().textContent()).trim()
}

async function joinRoom (page, code, name) {
  await page.locator('input[placeholder="Código da sala"]').fill(code)
  await page.locator('input[placeholder="Seu nome"]').fill(name)
  await page.getByRole('button', { name: 'Entrar' }).click()
}

test('2 players: join, play, reload and reconnect with no 404 or JS errors', { skip, timeout: 60_000 }, async () => {
  const a = await openPage(await browser.newContext())
  const b = await openPage(await browser.newContext())
  const code = await createRoom(a, 'Ana', 2)
  await joinRoom(b, code, 'Bruno')

  await a.locator('.hand-area .card').first().waitFor({ timeout: 10_000 })
  await b.locator('.hand-area .card').first().waitFor({ timeout: 10_000 })

  // Card art comes from local files
  const bg = await a.locator('.card').first().evaluate(el => getComputedStyle(el).backgroundImage)
  assert.match(bg, /\/images\/cards_sheet\.png/)

  // Selecting a hand card counts toward the sum
  const onTurn = await pageOnTurn([a, b])
  await onTurn.locator('.hand-area .card').first().click()
  assert.notEqual(await onTurn.locator('output.sum').textContent(), 'Soma: 0')
  await onTurn.getByRole('button', { name: 'Descartar' }).click()

  // A reloads: the same seat and hand come back
  const handBefore = await a.locator('.hand-area .card').count()
  await a.reload()
  await a.locator('.hand-area .card').first().waitFor({ timeout: 10_000 })
  assert.equal(await a.locator('.hand-area .card').count(), handBefore)

  assert.deepEqual(a.problems, [], `page A: ${a.problems.join(' | ')}`)
  assert.deepEqual(b.problems, [], `page B: ${b.problems.join(' | ')}`)
})

test('2 players: a full round of discards ends with the round-over dialog', { skip, timeout: 120_000 }, async () => {
  const a = await openPage(await browser.newContext())
  const b = await openPage(await browser.newContext())
  const code = await createRoom(a, 'Ana', 2)
  await joinRoom(b, code, 'Bruno')
  await a.locator('.hand-area .card').first().waitFor({ timeout: 10_000 })

  // 36 plays end a round. Discards never capture, so the round ends with 0 points each
  let plays = 0
  while (plays < 40) {
    const dialogOpen = await a.locator('dialog[open]').count() + await b.locator('dialog[open]').count()
    if (dialogOpen) break
    const onTurn = await pageOnTurn([a, b])
    await onTurn.locator('.hand-area .card').first().click()
    await onTurn.getByRole('button', { name: 'Descartar' }).click()
    plays++
    await new Promise(r => setTimeout(r, 100))
  }

  const page = (await a.locator('dialog[open]').count()) ? a : b
  const title = page.locator('dialog[open] h2')
  await title.waitFor({ timeout: 10_000 })
  assert.match(await title.textContent(), /Fim da rodada/)
  // The dialog must sit in the middle of the viewport, not at the top-left corner
  const box = await page.locator('dialog[open]').boundingBox()
  const view = page.viewportSize()
  assert.ok(Math.abs(box.x + box.width / 2 - view.width / 2) < 4, 'dialog is not horizontally centred')
  assert.ok(Math.abs(box.y + box.height / 2 - view.height / 2) < 4, 'dialog is not vertically centred')
  assert.equal(plays, 36, 'a round is 36 plays')

  assert.deepEqual(a.problems, [], `page A: ${a.problems.join(' | ')}`)
  assert.deepEqual(b.problems, [], `page B: ${b.problems.join(' | ')}`)
})

test('4 players: all four join, seats show teams A and B, and only one seat is on turn', { skip, timeout: 60_000 }, async () => {
  const pages = []
  for (let i = 0; i < 4; i++) pages.push(await openPage(await browser.newContext()))
  const code = await createRoom(pages[0], 'P1', 4)
  for (let i = 1; i < 4; i++) await joinRoom(pages[i], code, `P${i + 1}`)

  for (const p of pages) await p.locator('.hand-area .card').first().waitFor({ timeout: 10_000 })

  const seats = pages[0].locator('ol.seats li')
  assert.equal(await seats.count(), 4)
  const teams = await seats.evaluateAll(lis => lis.map(li => li.textContent.match(/· ([AB]) ·/)?.[1]))
  assert.deepEqual(teams, ['A', 'B', 'A', 'B'])
  assert.equal(await pages[0].locator('ol.seats li[aria-current="step"]').count(), 1)

  for (const p of pages) assert.deepEqual(p.problems, [], `page: ${p.problems.join(' | ')}`)
})
