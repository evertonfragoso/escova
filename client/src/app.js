import { Connection } from './connection.js'
import { SessionStore } from './session.js'
import { Lobby } from './lobby.js'
import { Board } from './board.js'

// Routes server state to the lobby (before the game) or the board (during the game)
class App {
  constructor (root) {
    this.root = root
    this.conn = new Connection()
    this.session = new SessionStore()
    this.lobby = new Lobby(root, this.conn, this.session)
    this.board = new Board(root, this.conn)
    this.inGame = false

    this.conn.on('state', state => this.onState(state))
    this.conn.on('roundOver', summary => this.board.renderRoundOver(summary))
    this.conn.on('connect', () => this.lobby.resume())
  }

  onState (state) {
    if (!state.started) {
      this.lobby.body.hidden = false
      this.board.body.hidden = true
      this.lobby.renderWaiting(state)
      return
    }
    this.inGame = true
    this.lobby.body.hidden = true
    this.board.body.hidden = false
    this.board.render(state)
  }
}

new App(document.getElementById('app'))
