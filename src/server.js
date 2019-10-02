require('dotenv').config()
require('console-stamp')(console, {
  metadata: function () {
    return '[' + process.memoryUsage().heapUsed / (1024 * 1024) + ']'
  },
  colors: {
    stamp: 'yellow',
    label: 'white',
    metadata: 'green'
  }
})

const fileUpload = require('express-fileupload')

global.__basedir = __dirname

const express = require('express')
const jwt = require('jsonwebtoken')
const http = require('http')
const cors = require('cors')
const bodyParser = require('body-parser')
const path = require('path')

const routes = require('./routes')
const models = require('./models')

const app = express()
app.server = http.createServer(app)

const whitelist = process.env.CORS_ENABLED_WHITELIST

const corsOptions = {
  exposedHeaders: ['Content-Range'],
  origin: process.env.CORS_ENABLED_WHITELIST &&
    process.env.CORS_ENABLED_WHITELIST.split(' ')
}
// Middleware express
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, '../public')))
app.use(fileUpload())
//My Middlewares
app.use(cors(corsOptions))
app.use('/v1', routes)

app.use((req, res, next) => {
  const error = new Error('Not found')
  error.status = 404
  next(error)
})

app.use((error, req, res, next) => {
  res.status(error.status || 500)
  res.json({
    error: {
      message: error.message
    }
  })
})

models.sequelize
  .sync()
  .then(function () {
    console.log('Nice! Database looks fine')
  })
  .catch(function (err) {
    console.log(err, 'Something went wrong with the Database Update!')
  })

const PORT = process.env.PORT || 3333

app.server.listen(PORT, () => {
  console.log(`Server is running on: ${PORT}`)
})
