const express = require('express')
const http = require('http')
const hbs = require('hbs')
const path = require('path')
const { Server } = require('socket.io')
const Filter = require('bad-words')
const words = require('naughty-words')
const BBCodeHtml = require('bb2').BBCodeHtml
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = new Server(server)

const port = process.env.PORT || 3000

const publicDirectoryPath = path.join(__dirname, '../public')
const viewsPath = path.join(__dirname, './templates/views')
const layoutsPath = path.join(__dirname, './templates/layouts')
const patrialsPath = path.join(__dirname, './templates/partials')

app.set('view engine', 'hbs')
app.set('views', [viewsPath, layoutsPath])
app.set('layouts', layoutsPath)
hbs.registerPartials(patrialsPath)

app.use(express.static(publicDirectoryPath))

app.get('/', (req, res) => {
    res.render('index', {
        title: 'Chat appliction',
        layout: 'main',
    })
})

app.get('/index', (req, res) => {
    res.render('chat', {
        title: 'Chat appliction',
        layout: 'main',
    })
})

io.on('connection', (socket) => {
    let date = new Date();
    let prefix = `[${date.toTimeString().slice(0, 8)}]`
    const bb = new BBCodeHtml()
    let username, room

    socket.on('join', (options , callback) => {
        const { user, error } = addUser({ id: socket.id, ...options })

        if (error) {
            return callback(error)
        }

        username = user.username
        room = user.room


        socket.join(room)

        socket.emit('botMsg', `${prefix}[Server]: Welcome ${username}!`)
        socket.broadcast.to(user.room).emit('botMsg', `${prefix}[Server]: ${user.username} has joined!`)
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMsg', (message, callback) => {
        const filter = new Filter()

        if (filter.isProfane(message) || words.hu.includes(message)) {
            return callback('Do not use profine lanuage!')
        }

        io.to(room).emit('botMsg', `${prefix}[${username}]: ${bb.parse(message)}`)
        callback('Message delivered!')
    })

    socket.on('sendLocation', (message, callback) => {
        io.to(room).emit('locationMsg', [`${prefix}[Server]: ${username} shared his/her position.`, message, username])
        callback('Location shared!')
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('botMsg', `${prefix}[Server]: ${username} has left!`)
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, () => {
    console.log(`The server is on port ${port}`)
})