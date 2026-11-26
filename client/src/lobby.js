import { h } from './dom.js'
import { EVENTS } from '/shared/events.js'
import { PLAYER_COUNTS } from '/shared/constants.js'

// Lobby: create or join a room, and show who is waiting. Game start is automatic when full.
export class Lobby {
  constructor (root, conn, session) {
    this.root = root
    this.conn = conn
    this.session = session
    this.error = h('p', { class: 'error' })
    this.body = h('div')
    this.root.append(this.body)
    this.renderForm()
  }

  renderForm (roomId = '') {
    const nameInput = h('input', { type: 'text', placeholder: 'Seu nome', maxlength: 20 })
    const roomInput = h('input', { type: 'text', placeholder: 'Código da sala', value: roomId })

    const createButtons = PLAYER_COUNTS.map(n => h('button', {
      type: 'button',
      on: { click: () => this.create(n, nameInput.value) }
    }, `Nova sala (${n} jogadores)`))

    this.body.replaceChildren(
      h('section', { class: 'panel' },
        h('h2', {}, 'Escova online'),
        h('div', { class: 'row' }, createButtons),
        h('div', { class: 'row', style: 'margin-top: 1rem' },
          nameInput,
          roomInput,
          h('button', { type: 'button', on: { click: () => this.join(roomInput.value, nameInput.value) } }, 'Entrar')
        ),
        this.error
      )
    )
  }

  renderWaiting (state) {
    this.body.replaceChildren(
      h('section', { class: 'panel' },
        h('h2', {}, 'Aguardando jogadores'),
        h('p', {}, 'Código da sala: ', h('strong', {}, state.roomId)),
        h('p', { class: 'muted' }, `${state.players.length} de ${state.capacity}. O jogo começa sozinho quando a sala encher.`),
        h('ul', { class: 'seats' },
          state.players.map(p => h('li', { class: p.id === state.you ? 'turn' : '' }, p.name)))
      )
    )
  }

  async create (capacity, name) {
    const res = await this.conn.request(EVENTS.ROOM_CREATE, { capacity })
    if (!res.ok) return this.setError(res.error)
    await this.join(res.roomId, name)
  }

  async join (roomId, name) {
    const res = await this.conn.request(EVENTS.ROOM_JOIN, { roomId: roomId.trim(), name: name.trim() })
    if (!res.ok) return this.setError(res.error)
    this.session.set(roomId.trim(), res.playerId)
  }

  // On page load: rejoin the same seat if this browser had one
  async resume () {
    const saved = this.session.get()
    if (!saved) return
    const res = await this.conn.request(EVENTS.ROOM_RECONNECT, { roomId: saved.roomId, token: saved.playerId })
    if (!res.ok) this.session.clear()
  }

  setError (message) {
    this.error.textContent = message
  }
}
