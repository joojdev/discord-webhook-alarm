const chalk = require('chalk')

function getTimestamp() {
  const date = new Date()

  return date.toLocaleTimeString()
}

function logInfo(text) {
  if (!text) return

  console.log([
    chalk.gray(`[${getTimestamp()}]`),
    chalk.white.bgYellow('[INFO]'),
    text
  ].join` `)
}

function logError(error) {
  if (!error) return

  console.log([
    chalk.gray(`[${getTimestamp()}]`),
    chalk.white.bgRed('[ERROR]'),
    text
  ].join` `)
}

function handleError(error) {
  logError(error)
  process.exit(1)
}

module.exports = {
  logInfo,
  logError,
  handleError
}