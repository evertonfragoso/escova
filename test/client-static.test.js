import { test, after, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { createServer } from '../server/index.js'

const { server, io } = createServer()
await new Promise(resolve => server.listen(0, resolve))
const base = `http://localhost:${server.address().port}`
after(() => { io.close(); server.close() })

const CLIENT = new URL('../client/', import.meta.url).pathname
const SHARED = new URL('../shared/', import.meta.url).pathname

function walk (dir) {
  return readdirSync(dir).flatMap(name => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

describe('client is served and uses only local assets', () => {
  test('index and modules are served', async () => {
    for (const path of ['/', '/src/app.js', '/src/board.js', '/shared/events.js', '/shared/constants.js',
      '/css/main.css', '/images/cards_sheet.png', '/images/card_back.png', '/images/background.jpg',
      '/images/escova.png', '/images/7belo.png', '/socket.io/socket.io.js']) {
      const res = await fetch(base + path)
      assert.equal(res.status, 200, `${path} should be served`)
    }
  })

  test('no external asset URLs in client files', () => {
    for (const file of walk(CLIENT).filter(f => /\.(html|css|js)$/.test(f))) {
      const text = readFileSync(file, 'utf8')
      assert.doesNotMatch(text, /cloudinary/i, `${file} references cloudinary`)
      assert.doesNotMatch(text, /url\(\s*['"]?https?:/i, `${file} loads an external url()`)
    }
  })

  test('no innerHTML: server data is never parsed as HTML', () => {
    for (const file of walk(join(CLIENT, 'src'))) {
      assert.doesNotMatch(readFileSync(file, 'utf8'), /innerHTML/, `${file} uses innerHTML`)
    }
  })

  test('shared event and constant files are browser-safe (no bare imports)', () => {
    for (const file of ['events.js', 'constants.js']) {
      assert.doesNotMatch(readFileSync(join(SHARED, file), 'utf8'), /^import /m, `${file} has an import`)
    }
  })

  test('client modules parse', () => {
    for (const file of walk(join(CLIENT, 'src'))) {
      execFileSync(process.execPath, ['--check', file])
    }
  })
})
