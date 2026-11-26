// Real-browser test. Opt-in: set CHROME_PATH to a Chromium binary and run `npm run test:e2e`.
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { chromium } from 'playwright-core'
import { createServer } from '../server/index.js'
import RoomManager from '../server/RoomManager.js'

const CHROME = process.env.CHROME_PATH
const skip = CHROME ? false : 'set CHROME_PATH to run'

const { server, io } = createServer({ rooms: new RoomManager({ graceMs: 60_000 }) })
await new Promise(resolve => server.listen(0, resolve))
const base = `http://localhost:${server.address().port}`
let browser

after(async () => {
  await browser?.close()
  io.close()
  server.close()
})

async function openPage (ctx) {
  const page = await ctx.newPage()
  page.errors = []
  page.on('pageerror', e => page.errors.push(e.message))
  page.on('console', m => { if (m.type() === 'error') page.errors.push(m.text()) })
  await page.goto(base)
  return page
}

test('two players join, play a turn, reload and reconnect', { skip, timeout: 60_000 }, async () => {
  browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] })
  const ctxA = await browser.newContext()
  const ctxB = await browser.newContext()
  const a = await openPage(ctxA)
  const b = await openPage(ctxB)

  // A creates a 2-player room and joins it with a name
  await a.locator('input[placeholder="Seu nome"]').fill('Ana')
  await a.getByRole('button', { name: 'Nova sala (2 jogadores)' }).click()
  await a.locator('text=Código da sala').waitFor()
  const roomCode = (await a.locator('strong').first().textContent()).trim()
  assert.ok(roomCode.length >= 4)

  // B joins with the code
  await b.locator('input[placeholder="Código da sala"]').fill(roomCode)
  await b.locator('input[placeholder="Seu nome"]').fill('Bruno')
  await b.getByRole('button', { name: 'Entrar' }).click()

  // Game starts on its own: both pages show the board
  await a.locator('.hand-area .card').first().waitFor({ timeout: 10_000 })
  await b.locator('.hand-area .card').first().waitFor({ timeout: 10_000 })

  // Card images come from local files, not a CDN
  const bg = await a.locator('.card').first().evaluate(el => getComputedStyle(el).backgroundImage)
  assert.match(bg, /\/images\/cards_sheet\.png/)

  // Whoever is on turn discards one card
  const onTurn = (await a.locator('p.muted', { hasText: /^Sua vez/ }).count()) ? a : b
  await onTurn.locator('.hand-area .card').first().click()
  // Selecting a hand card must count toward the sum (regression: it used to count 0)
  assert.notEqual(await onTurn.locator('output.sum').textContent(), 'Soma: 0')
  await onTurn.getByRole('button', { name: 'Descartar' }).click()
  await onTurn.locator('p.muted', { hasText: /^Aguardando / }).waitFor({ timeout: 5_000 })
  const other = onTurn === a ? b : a
  await other.locator('p.muted', { hasText: /^Sua vez/ }).waitFor({ timeout: 5_000 })

  // A reloads the page: the same seat comes back with its hand
  const handBefore = await a.locator('.hand-area .card').count()
  await a.reload()
  await a.locator('.hand-area .card').first().waitFor({ timeout: 10_000 })
  assert.equal(await a.locator('.hand-area .card').count(), handBefore)

  assert.deepEqual(a.errors, [], `page A errors: ${a.errors.join(' | ')}`)
  assert.deepEqual(b.errors, [], `page B errors: ${b.errors.join(' | ')}`)
})
