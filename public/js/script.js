'use strict'

const socket = io.connect('http://37.77.104.246:5052/')
let player, game

const nameFitler = (name) => {
    name = name.trim()
    console.log(name)
    let str = ""
    for (let i = 0; i < 10; i++) {
        if (i === name.length) break;
        str += name[i]
    }
    return str
}

pick.addEventListener('click', e => {
    if(localStorage.getItem('lose')) {
        if(!localStorage.getItem('count'))
            localStorage.setItem('count', 30)
        
        document.body.innerHTML = `<p>Присоединиться можно будет через: ${localStorage.getItem('count')}</p>`
        let interval = setInterval(()=>{
            let c = localStorage.getItem('count') - 1
            document.body.innerHTML = `
                <p>Присоединиться можно будет через: ${c}</p>
            `

            localStorage.setItem('count', c)

            if(+localStorage.getItem('count') <= 0) {
                localStorage.clear()
                window.location.reload()
            }
        }, 1000)
        
        return
    }

    const name = nameFitler(document.querySelector('#user-name').value)
    const color = document.querySelector('#color-field').value

    document.querySelector('#color-picker').remove()

    player = new Player(name, color)
    game = new Game(60, 10, 10)
    game.renderPlayers([player])

    socket.emit('move', player)

    socket.on('move', (players) => {
        game.renderPlayers(players)
    })

    socket.on('kill', () => {
        localStorage.setItem('lose', true)
        window.location.reload()
    })
})

const settings = {
    rowCount: 15,
    collCount: 15
}

class Game {
    constructor(size) {
        this.size = size
        this.rowCount = settings.rowCount
        this.collCount = settings.collCount

        this.generateTable()
    }

    renderPlayers(players) {
        this.clearPlayers()
        this.generatePlayers(players)
    }

    generateTable() {
        const tableElem = document.createElement('table')
        tableElem.id = 'game'

        for (let row = 0; row < this.rowCount; row++) {
            const rowElem = document.createElement('tr')

            for (let coll = 0; coll < this.collCount; coll++) {
                const collElem = document.createElement('td')
                collElem.dataset.row = row
                collElem.dataset.coll = coll

                rowElem.appendChild(collElem)
            }

            tableElem.appendChild(rowElem)
        }

        document.body.appendChild(tableElem)
    }

    generatePlayers(players) {
        console.log(players)
        players.forEach(player => {
            const posElem = document.querySelector(`[data-row="${player.y}"][data-coll="${player.x}"]`)
            posElem.style.backgroundColor = player.color
            posElem.textContent = player.name
        })
    }

    clearPlayers() {
        const allPosElems = document.querySelectorAll('td')
        allPosElems.forEach(elem => {
            elem.style.backgroundColor = ""
            elem.textContent = ""
        })
    }
}

class Player {
    constructor(name, color) {
        this.name = name
        this.color = color

        this.generatePosition()
        this.initEvents()
    }

    initEvents() {
        document.addEventListener('keydown', e => {
            switch (e.keyCode) {
                case 37:
                case 65:
                    this.setNewPosition('left')
                    break
                case 68:
                case 39:
                    this.setNewPosition('right')
                    break
                case 40:
                case 83:
                    this.setNewPosition('down')
                    break
                case 38:
                case 87:
                    this.setNewPosition('up')
                    break
                case 32:
                    this.atack()
                    break
            }
        })
    }

    atack() {
        let points = []
        for (let row = this.y - 1; row <= this.y + 1; row++) {
            for (let coll = this.x - 1; coll <= this.x + 1; coll++) {
                if (row < 0 || row >= settings.rowCount || coll >= settings.rowCount || coll < 0) continue;
                points.push({ y: row, x: coll })
            }
        }

        socket.emit('atack', points)
    }

    setNewPosition(direction) {
        const { x, y } = this.getPotentialPosition(direction)
        this.x = x
        this.y = y
        socket.emit('move', player)
    }

    getPotentialPosition(direction) {
        switch (direction) {
            case "left":
                return this.x - 1 < 0
                    ? { x: this.x, y: this.y }
                    : { x: this.x - 1, y: this.y }
            case "right":
                return this.x + 1 > settings.collCount - 1
                    ? { x: this.x, y: this.y }
                    : { x: this.x + 1, y: this.y }
            case "up":
                return this.y - 1 < 0
                    ? { x: this.x, y: this.y }
                    : { x: this.x, y: this.y - 1 }
            case "down":
                return this.y + 1 > settings.rowCount - 1
                    ? { x: this.x, y: this.y }
                    : { x: this.x, y: this.y + 1 }
        }
    }

    generatePosition() {
        this.x = Math.floor(Math.random() * settings.collCount)
        this.y = Math.floor(Math.random() * settings.rowCount)
    }
}