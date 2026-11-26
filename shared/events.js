// Socket event names. No imports, so the browser can load this file as-is.
export const EVENTS = Object.freeze({
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  ROOM_RECONNECT: 'room:reconnect',
  ROOM_STATE: 'room:state',
  ROOM_LEAVE: 'room:leave',
  ROOM_REMATCH: 'room:rematch',
  GAME_PLAY: 'game:play',
  ROUND_OVER: 'round:over'
})
