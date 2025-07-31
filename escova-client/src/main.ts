import * as Colyseus from "colyseus.js"

const client = new Colyseus.Client("ws://localhost:3000")

// HTML targets
const statusDiv = document.getElementById("status")!
const tableDiv = document.getElementById("table")!
const handDiv = document.getElementById("hand")!
const logsDiv = document.getElementById("logs")!

function renderCard(card: any, elementId: any): HTMLElement {
  const el = document.createElement("div")
  el.className = `card ${card.suit}`
  el.id = elementId
  el.textContent = `${card.value} of ${card.suit}`
  return el
}

function render(state: EscopaState, room: Room<EscopaState>) {
  const me = state.players.get(room.sessionId)
  if (!me) {
    console.warn("Local player not found in state.players")
    return
  }

  // Clear existing elements
  handDiv.innerHTML = ''
  tableDiv.innerHTML = ''

  // Render hand
  me.hand.forEach((card, index) => {
    const el = renderCard(card, `hand-${index}`)
    handDiv.appendChild(el)
  })

  // Render table
  state.table.items.forEach((card, index) => {
    const el = renderCard(card, `table-${index}`)
    tableDiv.appendChild(el)
  })
}

async function main() {
  try {
    const room = await client.joinOrCreate("escopa")

    statusDiv.textContent = `Connected as ${room.sessionId}`

    console.log(`Connected as ${room.sessionId}`)

    room.onStateChange.once((state) => {
      console.log("Initial state received:", state)

      render(state, room) // initial render

      // Set up live updates as needed
      state.players.onAdd = (player, sessionId) => {
        if (sessionId === room.sessionId) {
          player.hand.onAdd = () => render(state, room)
          player.hand.onRemove = () => render(state, room)
        }
      }

      state.table.items.onAdd = () => render(state, room)
      state.table.items.onRemove = () => render(state, room)

      //console.log("table:", state.table)
      //console.log("my hand:", me.hand)
    })

    // Listen for server messages
    room.onMessage("*", (type, message) => {
      console.log("Received message:", type, message)
      logsDiv.textContent = `${logsDiv.textContent}\n${type}: ${message.message}`
    })

  } catch (err) {
    console.error("Failed to connect:", err)
  }
}

main()
