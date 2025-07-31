import { WebSocketTransport } from "@colyseus/ws-transport";
import { Server } from "colyseus";
import express from "express";
import cors from "cors";

import config from "./config/config";

import { EscopaRoom } from "./rooms/EscopaRoom";

const app = express();
app.use(cors());
app.use(express.static("public"));

const gameServer = new Server({
  transport: new WebSocketTransport({ server: app.listen(config.port) })
});

gameServer.define("escopa", EscopaRoom);

// REMOVE after dev is done
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === "string" && 
    args[0].includes("seat reservation expired")
  ) {
    return; // suppress this error
  }
  originalConsoleError(...args); // allow other errors
};

console.log(`Server listening on ${config.host}:${config.port}`);
