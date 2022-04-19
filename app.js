const express = require('express')
const app = express()
const server = require('http').Server(app)
const websocket = require('socket.io')(server)

const path = require('path')
const fs = require('fs')

// Публичная папка
app.use(express.static(path.join(__dirname, 'public')))

// Главный маршрут
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'))
})

//ws.broadcast.emit('message', { message: 'привет от сокета' }) // Всем, кроме отправителя

// Массив объектов игроков
let players = []
// Массив WebSocket-соединений
let connections = []

// Слушатель события подключений
websocket.on('connection', (ws) => {
    // Добавляет соединение в массив соединений
    connections.push(ws)

    ws.on('move', data => {
        // data - объект игрока с координатами, именем и цветом, который пришел с фронтенда после нажатия на кнопку движения
        // Добавляем id соединения объекту игрока, чтобы его идентифицировать
        data.id = ws.id

        // Добавляем игрока в массив игроков
        addPlayer(data)

        // Оповещаем всех пользователей об обновлении игрока
        websocket.emit('move', players)
    })

    // Событие отключения пользователя
    ws.on('disconnect', () => {
        // Удаляет из массива всех соединений отключенного пользователя
        deleteConnection(ws)
        // Удаляет из массива игроков отключенного пользователя
        deletePlayer(ws.id)
    })

    // Событие атаки
    // Срабатывает каждый раз, когда пользователь нажимает на пробел
    // Принимает массив точек в радиусе игрока
    ws.on('atack', data => {
        // Перебираем весь массив игроков
        players.forEach(player => {
            // Перебираем весь массив точек
            data.forEach(point => {
                // Проверяем, что хотя бы одна точка совпала с точкой любого игрока, id которого не такое же как у атакующего (отправителя данных)
                if(player.x === point.x && player.y === point.y && player.id !== ws.id) {
                    // Удаляем убитого игрока
                    deletePlayer(player.id)

                    // Пробегаемся по массиву соединений
                    connections.forEach((connection, index) => {
                        // Если нашли соединение убитого персонажа
                        if(connection.id === player.id) {
                            // Отправляем событие kill
                            connection.emit('kill')

                            // Выполняем дисконнект
                            connection.disconnect()
                        }
                    })

                    // Отправляем всем пользователям актуальные позиции игроков
                    websocket.emit('move', players)
                }
            })
        })
    })
    

    // Удаляет игрока из массива игроков
    // Принимает id ws-соединения
    const deletePlayer = (id) => {
        players = players.filter(pl => pl.id !== id)
    }

    // Удаляет объект ws-соединения из массива соединений
    // Принимает объект соединения
    const deleteConnection = (ws) => {
        connections.splice(connections.indexOf(ws), 1)
    }

    // Добавляет или обновляет игрока в массиве игроков.
    // Принимает объект игрока с ID соединения
    const addPlayer = (player) => {
        let found = false
        players.forEach((pl, index) => {
            if(pl.id === player.id) {
                players[index] = player
                found = true
            }
        })
        if(!found) {
            players.push(player)
        }
    }
})

server.listen(5052, () => console.log('Сервер запущен на порту 5052'))