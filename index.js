import express from 'express'
import { createServer } from 'node:http'

import Main from '#server/Main.js'

const port = process.env.PORT || 3000

const app = express()
const httpServer = createServer(app)

/*
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

// open the database file
const db = await open({filename: 'game.db', driver: sqlite3.Database});

// create 'table1' table
await db.exec(`
  CREATE TABLE IF NOT EXISTS table1 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_offset TEXT UNIQUE,
      content TEXT
  );
`);
*/

app.use(express.static('client'))

const game = new Main(httpServer)
game.start()

httpServer.listen(port, () => { console.log(`listening on *:${port}`) })
