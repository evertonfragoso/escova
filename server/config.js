// Server settings. Read from environment variables when set, otherwise the defaults below.
const env = process.env

export const config = Object.freeze({
  port: Number(env.PORT) || 3000,
  // How long a started game survives with nobody connected before it is removed
  roomGraceMs: Number(env.ROOM_GRACE_MS) || 10 * 60 * 1000
})
