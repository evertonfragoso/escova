import { io } from 'socket.io-client'
import { writable } from 'svelte/store'
import { EVENTS } from '../../../shared/events.js'
import { session } from './session.js'

// Server state and round summaries, as stores the components subscribe to
export const roomState = writable(null)
export const roundSummary = writable(null)

export const socket = io()

socket.on(EVENTS.ROOM_STATE, state => roomState.set(state))
// A round that ends the game is announced by the game-over dialog, not the round dialog
socket.on(EVENTS.ROUND_OVER, summary => {
  if (!summary.winner) roundSummary.set(summary)
})
socket.on('connect', resume)

// Promise-based request: resolves with the server ack { ok, ... }
export function request (event, payload) {
  return new Promise(resolve => socket.emit(event, payload, resolve))
}

export function dismissRoundSummary () {
  roundSummary.set(null)
}

// Leaves a finished game: the server frees the seat, and this browser forgets it
export async function leaveRoom () {
  const res = await request(EVENTS.ROOM_LEAVE, {})
  if (res.ok) {
    session.clear()
    roomState.set(null)
    roundSummary.set(null)
  }
  return res
}

// After a page load or a socket reconnect, take the same seat back if this browser had one
async function resume () {
  const saved = session.get()
  if (!saved) return
  const res = await request(EVENTS.ROOM_RECONNECT, { roomId: saved.roomId, token: saved.playerId })
  if (!res.ok) session.clear()
}
