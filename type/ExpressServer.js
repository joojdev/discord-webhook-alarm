const express = require('express')
const http = require('http')
const { logInfo } = require('../utils.js')

function ExpressServer(port) {
  this.port = port

  this._expressApp = express()
  this._httpServer = http.createServer(this._expressApp)

  this.registerRoute = (requestType, route, callback) => {
    this._expressApp[requestType](route, (request, response) => {
      callback(request, response)
    })
  }

  this.listen = () => {
    this._httpServer.listen(this.port, () => {
      logInfo(`This server is listening on port ${this.port}!`)
    })
  }
}

module.exports = ExpressServer