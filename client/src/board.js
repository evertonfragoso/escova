import { h } from './dom.js'
import { createCardElement } from './card.js'
import { EVENTS } from '/shared/events.js'
import { TAKE_SUM, TEAMS, TARGET_SCORE } from '/shared/constants.js'

// The game board. The server is the authority: these checks only guide the UI.
export class Board {
  constructor (root, conn) {
    this.root = root
    this.conn = conn
    this.state = null
    this.selectedHand = null
    this.selectedTable = new Set()
    this.error = h('p', { class: 'error' })
    this.body = h('div')
    this.root.append(this.body)
    this.overlay = null
  }

  render (state) {
    this.state = state
    this.pruneSelection()
    const round = state.round
    const myTurn = round.currentPlayerId === state.you
    const me = round.players.find(p => p.id === state.you)

    this.body.replaceChildren(
      this.renderScores(state),
      this.renderSeats(state, round),
      h('section', { class: 'panel' },
        h('p', { class: 'muted' }, `Monte: ${round.deckSize} cartas`),
        h('h3', {}, 'Mesa'),
        h('div', { class: 'table-area' },
          round.table.length
            ? round.table.map(c => createCardElement(c, {
              selectable: myTurn,
              selected: this.selectedTable.has(c.id),
              onClick: id => this.toggleTable(id)
            }))
            : h('p', { class: 'muted' }, 'Mesa vazia')
        )
      ),
      this.renderHand(me, myTurn),
      this.renderActions(me, round, myTurn),
      this.error
    )
  }

  renderScores (state) {
    return h('section', { class: 'panel row' },
      TEAMS.map(t => h('strong', {}, `Equipe ${t}: ${state.scores[t]}`)),
      h('span', { class: 'muted' }, `Meta: ${TARGET_SCORE}`)
    )
  }

  renderSeats (state, round) {
    return h('ul', { class: 'seats' },
      round.players.map(p => {
        const info = state.players.find(x => x.id === p.id)
        return h('li', {
          class: [
            p.id === round.currentPlayerId ? 'turn' : '',
            info.connected ? '' : 'offline'
          ].join(' ')
        },
        `${p.id === state.you ? 'Você' : p.name} · ${p.team} · ${p.handSize} na mão · ${p.capturedCount} capturadas`,
        info.connected ? '' : ' (desconectado)',
        p.escovas ? [' · ', h('img', { src: '/images/escova.png', alt: 'escova', height: 18 }), ` ${p.escovas}`] : '')
      })
    )
  }

  renderHand (me, myTurn) {
    if (!me || !me.hand) return h('section', { class: 'panel' }, h('p', {}, 'Sem cartas na mão.'))
    return h('section', { class: 'panel' },
      h('h3', {}, 'Minhas cartas'),
      h('div', { class: 'hand-area' },
        me.hand.map(c => createCardElement(c, {
          selectable: myTurn,
          selected: this.selectedHand === c.id,
          onClick: id => this.selectHand(id)
        }))
      )
    )
  }

  renderActions (me, round, myTurn) {
    const sum = this.selectionSum()
    const canDiscard = myTurn && this.selectedHand && this.selectedTable.size === 0
    const canCapture = myTurn && this.selectedHand && this.selectedTable.size > 0 && sum === TAKE_SUM
    const sumClass = sum === TAKE_SUM ? 'ok' : (this.selectedTable.size || this.selectedHand ? 'bad' : '')

    const status = myTurn
      ? 'Sua vez: escolha uma carta da mão e, se quiser capturar, cartas da mesa que somem 15.'
      : `Aguardando ${round.players.find(p => p.id === round.currentPlayerId)?.name ?? ''}`

    return h('section', { class: 'panel row' },
      h('span', { class: `sum ${sumClass}` }, `Soma: ${sum}`),
      h('button', { type: 'button', disabled: !canDiscard, on: { click: () => this.play([]) } }, 'Descartar'),
      h('button', {
        type: 'button',
        disabled: !canCapture,
        on: { click: () => this.play([...this.selectedTable]) }
      }, 'Capturar'),
      h('p', { class: 'muted' }, status)
    )
  }

  renderRoundOver (summary) {
    const rows = Object.entries(summary.breakdown).map(([k, v]) =>
      h('li', {}, `${k}: ${typeof v === 'object' ? JSON.stringify(v) : (v ?? 'empate')}`))
    const winnerText = summary.winner ? `Equipe ${summary.winner} venceu o jogo!` : 'Próxima rodada'

    this.closeOverlay()
    this.overlay = h('div', { class: 'overlay' },
      h('section', { class: 'panel' },
        h('h2', {}, winnerText),
        h('p', {}, `Pontos da rodada: A ${summary.points.A} · B ${summary.points.B}`),
        h('p', {}, `Placar: A ${summary.scores.A} · B ${summary.scores.B}`),
        h('ul', {}, rows),
        h('button', { type: 'button', on: { click: () => this.closeOverlay() } }, 'Continuar')
      )
    )
    this.root.append(this.overlay)
  }

  closeOverlay () {
    this.overlay?.remove()
    this.overlay = null
  }

  selectHand (cardId) {
    this.selectedHand = this.selectedHand === cardId ? null : cardId
    this.refresh()
  }

  toggleTable (cardId) {
    if (this.selectedTable.has(cardId)) this.selectedTable.delete(cardId)
    else this.selectedTable.add(cardId)
    this.refresh()
  }

  selectionSum () {
    if (!this.state?.round) return 0
    const table = this.state.round.table.filter(c => this.selectedTable.has(c.id))
    return table.reduce((n, c) => n + c.value, 0)
  }

  async play (tableCardIds) {
    const res = await this.conn.request(EVENTS.GAME_PLAY, {
      cardId: this.selectedHand,
      tableCardIds
    })
    if (!res.ok) {
      this.error.textContent = res.error
      return
    }
    this.error.textContent = ''
    this.selectedHand = null
    this.selectedTable.clear()
  }

  // Drops selections that no longer exist after a server update
  pruneSelection () {
    const round = this.state?.round
    if (!round) return
    const me = round.players.find(p => p.id === this.state.you)
    const inHand = new Set((me?.hand ?? []).map(c => c.id))
    const onTable = new Set(round.table.map(c => c.id))
    if (this.selectedHand && !inHand.has(this.selectedHand)) this.selectedHand = null
    for (const id of [...this.selectedTable]) if (!onTable.has(id)) this.selectedTable.delete(id)
  }

  refresh () {
    if (this.state) this.render(this.state)
  }
}

