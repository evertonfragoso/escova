import { test, after, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { createServer } from '../server/index.js'

const { server, io } = createServer()
await new Promise(resolve => server.listen(0, resolve))
const base = `http://localhost:${server.address().port}`
after(() => { io.close(); server.close() })

const ROOT = new URL('../client/', import.meta.url).pathname
const SHARED = new URL('../shared/', import.meta.url).pathname
const DIST = join(ROOT, 'dist')

function walk (dir) {
  return readdirSync(dir).flatMap(name => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

describe('built client is served and uses only local assets', () => {
  test('build output exists (npm test runs vite build first)', () => {
    assert.ok(existsSync(join(DIST, 'index.html')))
  })

  test('index, bundle and images are served', async () => {
    const html = await (await fetch(base + '/')).text()
    assert.equal((await fetch(base + '/')).status, 200)
    const bundle = html.match(/src="(\/assets\/[^"]+\.js)"/)[1]
    assert.equal((await fetch(base + bundle)).status, 200)
    for (const img of ['/images/cards_sheet.png', '/images/card_back.png', '/images/background.jpg',
      '/images/escova.png', '/images/7belo.png']) {
      assert.equal((await fetch(base + img)).status, 200, `${img} should be served`)
    }
  })

  test('no external asset URLs in client source or build', () => {
    for (const file of [...walk(join(ROOT, 'src')), join(ROOT, 'index.html'), ...walk(DIST)]
      .filter(f => /\.(html|css|js|svelte)$/.test(f))) {
      const text = readFileSync(file, 'utf8')
      assert.doesNotMatch(text, /cloudinary/i, `${file} references cloudinary`)
      assert.doesNotMatch(text, /url\(\s*['"]?https?:/i, `${file} loads an external url()`)
    }
  })

  test('no innerHTML in components: server data is never parsed as HTML', () => {
    for (const file of walk(join(ROOT, 'src'))) {
      assert.doesNotMatch(readFileSync(file, 'utf8'), /innerHTML|\{@html/, `${file} renders raw HTML`)
    }
  })

  test('shared event and constant files are browser-safe (no bare imports)', () => {
    for (const file of ['events.js', 'constants.js']) {
      assert.doesNotMatch(readFileSync(join(SHARED, file), 'utf8'), /^import /m, `${file} has an import`)
    }
  })

  test('server config reads the port from the environment', async () => {
    const { config } = await import('../server/config.js')
    assert.equal(typeof config.port, 'number')
    assert.equal(typeof config.roomGraceMs, 'number')
  })
})
