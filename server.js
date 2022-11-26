import express from 'express'
const app = express()
import { createServer } from 'http'
const server = createServer(app)
import { Server } from 'socket.io'
import cors from 'cors'
const io = new Server(server)
import { createClient } from 'redis'
import { v4 } from 'uuid'
import moment from 'moment'
//import { useStore } from './src/store.js'
import pkg1 from 'body-parser';
const { json } = pkg1;

import pkg from 'chalk'
const { blueBright, greenBright, redBright, yellowBright } = pkg;

//const [users, setUsers] = useState([])
/*const { setCod } = useStore(({ setCod }) => ({
  username,
  roomId,
  setCod,
}))*/

const client = createClient()
app.use(json())
app.use(cors())

client.on('error', console.error)
client
  .connect()
  .then(() => console.log(blueBright.bold('Connected to redis locally!')))
  .catch(() => {
    console.error(redBright.bold('Error connecting to redis'))
  })

app.get('/', (req, res) => {
  res.send({ msg: 'hi' })
})

app.post('/create-room-with-user', async (req, res) => {
  const { username } = req.body
  const roomId = v4()

  await client
    .hSet(`${roomId}:info`, { 
      created: moment(),
      updated: moment(),
      //code:'',
    })
    .catch((err) => {
      console.error(1, err)
    })

  // await client.lSet(`${roomId}:users`, [])

  res.status(201).send({ roomId })
})

io.on('connection', (socket) => {
  console.log(yellowBright.bold('new USER'))
  //setCod(client.hGet(`${roomId}:info`, 'code')) ////// NUEVO
  socket.on('CODE_CHANGED', async (code) => {
    const { roomId, username } = await client.hGetAll(socket.id)
    const roomName = `ROOM:${roomId}`
    // io.emit('CODE_CHANGED', code)
    socket.to(roomName).emit('CODE_CHANGED', code)
    /*await client
    .hSet(`${roomId}:info`, { 
      code:cod
    })
    .catch((err) => {
      console.error(1, err)
    })*/
  })

  socket.on('DISSCONNECT_FROM_ROOM', async ({ roomId, username }) => {})

  socket.on('CONNECTED_TO_ROOM', async ({ roomId, username }) => {
    await client.lPush(`${roomId}:users`, `${username}`)
    await client.hSet(socket.id, { roomId, username })
    const users = await client.lRange(`${roomId}:users`, 0, -1)
    const roomName = `ROOM:${roomId}`
    socket.join(roomName)
    io.in(roomName).emit('ROOM:CONNECTION', users)
  })

  socket.on('disconnect', async () => {
    // TODO if 2 users have the same name
    const { roomId, username } = await client.hGetAll(socket.id)
    const users = await client.lRange(`${roomId}:users`, 0, -1)
    const newUsers = users.filter((user) => username !== user)
    if (newUsers.length) {
      await client.del(`${roomId}:users`)
      await client.lPush(`${roomId}:users`, newUsers)
    } else {
      await client.del(`${roomId}:users`)
    }

    const roomName = `ROOM:${roomId}`
    io.in(roomName).emit('ROOM:CONNECTION', newUsers)
  })
})

server.listen(3001, () => {
  console.log(greenBright.bold('listening on *:3001'))
})
