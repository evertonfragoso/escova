// Remembers this browser's seat so a page reload can reconnect to the same game
const KEY = 'escova.session'

export class SessionStore {
  get () {
    try {
      return JSON.parse(localStorage.getItem(KEY))
    } catch {
      return null
    }
  }

  set (roomId, playerId) {
    localStorage.setItem(KEY, JSON.stringify({ roomId, playerId }))
  }

  clear () {
    localStorage.removeItem(KEY)
  }
}
