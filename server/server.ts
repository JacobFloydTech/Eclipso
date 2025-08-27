import { WebSocketServer } from 'ws'
import type { WebSocket } from 'ws'
import { PrismaClient } from '@prisma/client'
const connections: Record<string, WebSocket> = {}
const prisma = new PrismaClient()
const server = new WebSocketServer({ port: 8080 })

console.log('Starting WS on 8080')
server.on('connection', (ws) => {
  let username = ''
  ws.on('message', async (m) => {
    const message = JSON.parse(m.toString())
    username = message.username
    if (message.type == 'connect') {
      connections[username] = ws
      console.log(`${username} has connected`)
    } else if (message.type == 'disconnect') {
      delete connections[username]
      console.log(`${username} has disconnected`)
    } else if (message.type == 'message') {
      delete message.type
      const newData = await prisma.message.create({
        data: message
      })
      try {
        connections[newData.receiverUsername].send(JSON.stringify(newData))
      } catch (e) {
        console.log(e)
      }
    }
  })
  ws.on('error', (e) => console.error(e))
})
