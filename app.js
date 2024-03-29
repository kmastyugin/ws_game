const express = require('express')
const app = express()
const server = require('http').Server(app) // Создание HTTP-сервера, который принимает объект express
const websocket = require('socket.io')(server) // Создание websocket-сервера, который принимает объект HTTP-сервера

// Пакеты для работы с директориями
const path = require('path')
const fs = require('fs')

app.use(express.static(path.join(__dirname, 'public'))) // Публичная папка

// Главный маршрут
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'))
})

//ws.broadcast.emit('message', { message: 'привет от сокета' }) // Всем, кроме отправителя


let players = [] // Массив объектов игроков
let connections = [] // Массив WebSocket-соединений

// Слушатель события подключений
websocket.on('connection'/* <- событие подключения */, (ws) => {
    // Добавляет соединение в массив соединений
    connections.push(ws)

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////// [ЗАДАНИЕ 3]
    // Событие move, которое срабатывает в момент движения любого игрока
    ws.on('move', data => {
        // data - объект игрока с координатами, именем и цветом, который пришел с фронтенда после нажатия на кнопку движения
        data.id = ws.id // Добавляем id соединения объекту игрока, чтобы его идентифицировать
 
        addPlayer(data) // Добавляем игрока в массив игроков. !!!Нужно вызвать некую функцию и передать аргумент!!!
 
        websocket.emit('move', players) // Оповещаем всех пользователей об обновлении игрока
    })

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////// [ЗАДАНИЕ 4]
    // Событие отключения пользователя
    ws.on('disconnect'/* <- событие отключения */, () => {
        deleteConnection(ws) // Удаляет из массива всех соединений отключенного пользователя
        deletePlayer(ws.id) // Удаляет из массива фигуру отключенного пользователя
        websocket.emit('move', players)
    })

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////// [ЗАДАНИЕ 5]
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
                    deletePlayer(player.id) // Удаляем убитого игрока
 
                    // Пробегаемся по массиву соединений
                    connections.forEach((connection, index) => {
                        // Если нашли соединение убитого персонажа
                        if(connection.id === player.id) {
                            connection.emit('kill') // Отправляем событие kill соединению, которое совпало с id удаленного игрока
                            connection.disconnect() // Выполняем дисконнект подключению, которое совпало с id удаленного игрока
                        }
                    })
 
                    websocket.emit('move', players) // Отправляем всем пользователям актуальные позиции игроков(объект players), при помощи события move
                }
            })
        })
    })
    
    /**!!!!!!!!!!!!!!!!!!!!  Функции, которые необходимо вызывать в участках кода выше, чтобы не реализовывать часть функционала */

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
    // Принимает объект игрока с установленным свойством ID соединения
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

// Слушатель входящий запросов к серверу
server.listen(3000, () => console.log('Сервер запущен на порту 3000'))