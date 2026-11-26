import { EVENTS } from '/shared/events.js'

// Wraps socket.io: promise-based requests, and named listeners for server pushes
export class Connection {
  constructor () {
    this.socket = io()
    this.listeners = { state: [], roundOver: [], connect: [] }

    this.socket.on(EVENTS.ROOM_STATE, state => this._emit('state', state))
    this.socket.on(EVENTS.ROUND_OVER, summary => this._emit('roundOver', summary))
    this.socket.on('connect', () => this._emit('connect'))
  }

  on (name, fn) {
    this.listeners[name].push(fn)
  }

  request (event, payload) {
    return new Promise(resolve => this.socket.emit(event, payload, resolve))
  }

  _emit (name, data) {
    for (const fn of this.listeners[name]) fn(data)
  }
}
