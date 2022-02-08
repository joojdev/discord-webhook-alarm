require('dotenv').config()

const JSONdb = require('simple-json-db')
const { WebhookClient } = require('discord.js')
const { logInfo } = require('./utils.js')
const routineDatabase = new JSONdb('./routine.json', {
  jsonSpaces: 2
})
const cacheDatabase = new JSONdb('./cache.json', {
  jsonSpaces: 2
})
cacheDatabase.set('appointments', [])
cacheDatabase.set('day', null)

const ExpressServer = require('./type/ExpressServer.js')
const server = new ExpressServer(3000)

server.registerRoute('get', '/hello', (request, response) => {
  response.json({ message: 'Hello, World!' })
})

server.listen()

const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_URL })

function pad(number, size) {
  const numberString = String(number)
  if (numberString.length >= size) return numberString
  const numberArray = Array({ length: size - numberString.length }).map((_) => '0')
  numberArray.push(numberString)
  return numberArray.join``
}

function getCurrentTimeByTimezone(timeZone) {
  return new Date(new Date().toLocaleString('en-US', { timeZone }))
}

function getCurrentAppointments() {
  const days = routineDatabase.get('days')
  const currentDay = getCurrentTimeByTimezone('America/Sao_Paulo')
  const currentDayInfo = days.find((dayInfo) => dayInfo.day == currentDay.getDay())

  return currentDayInfo.appointments.filter((appointmentInfo) => {
    const isSameHour = (currentDay.getHours() == appointmentInfo.hour)

    if (isSameHour) {
      return (currentDay.getMinutes() < appointmentInfo.minute)
    }
    return (currentDay.getHours() < appointmentInfo.hour)
  })
}

async function wait(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}

function getLateAppointments(appointments) {
  const currentDay = getCurrentTimeByTimezone('America/Sao_Paulo')
  return appointments.filter((appointmentInfo) => {
    const isSameHour = (currentDay.getHours() == appointmentInfo.hour)
    if (!isSameHour) return false

    return (currentDay.getMinutes() >= appointmentInfo.minute)
  })
}

async function start() {
  const currentAppointments = getCurrentAppointments()
  const currentDay = getCurrentTimeByTimezone('America/Sao_Paulo')
  cacheDatabase.set('day', currentDay.getDay())
  cacheDatabase.set('appointments', currentAppointments)
  logInfo(`Alarm started with ${currentAppointments.length} appointments!`)

  async function waitForNextDay() {
    await wait(1000 * 60 * 5)

    const cacheDay = cacheDatabase.get('day')
    const currentDay = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))

    if (currentDay.getDay() == cacheDay) {
      logInfo('Day verified!')
      return await waitForNextDay()
    } else {
      return await waitForAppointment()
    }
  }

  async function waitForAppointment() {
    await wait(1000 * 60)
    
    const lateAppointments = getLateAppointments(cacheDatabase.get('appointments'))
    
    const lateAppointmentsNameArray = lateAppointments.map((appointmentInfo) => appointmentInfo.name)
    const newAppointments = cacheDatabase.get('appointments').filter((appointmentInfo) => !lateAppointmentsNameArray.includes(appointmentInfo.name))
    cacheDatabase.set('appointments', newAppointments)

    for (const appointment of lateAppointments) {
      webhookClient.send([
        '**ATENÇÃO!**',
        `Alarme **${appointment.name}**! *${pad(appointment.hour, 2)}:${pad(appointment.minute, 2)}*`,
        `<@&${process.env.ROLE}>`
      ].join`\n`)
      logInfo(`Alarm ${appointment.name} is late!`)
    }

    logInfo('Appointments verified!')

    if (!cacheDatabase.get('appointments').length) return await waitForNextDay()
    return await waitForAppointment()
  }

  if (!currentAppointments.length) return await waitForNextDay()
  return await waitForAppointment()
}

start()