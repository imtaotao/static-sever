const Server = require('./server')
const express = require('express')

function myself () {
  const app = new Server()
  app.static('./')
  app.listener(3000, res => {
    console.log('> Server listener at: http://localhost:3000 \n')
  })
}

function ex () {
  const app = express()
  app.use(express.static('./'))
  app.listen(3000, res => {
    console.log('> Server listener at: http://localhost:3000 \n')
  })
}

myself()
// ex()
