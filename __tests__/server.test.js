import request from 'supertest'
import { createServer } from '../index.js'

describe('server', () => {
  let app

  beforeAll(() => {
    const serverBundle = createServer()
    app = serverBundle.app
  })

  test('serves the lobby page', async () => {
    const response = await request(app).get('/')

    expect(response.status).toBe(200)
    expect(response.text).toContain('Escova online')
  })
})
