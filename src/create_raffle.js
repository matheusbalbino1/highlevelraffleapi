const { v4: uuidv4 } = require("uuid")
const tmi = require("tmi.js")
const { raffles } = require("./main")
const moment = require("moment")

const addRaffle = (
  streamer_id,
  raffle_id,
  odd_subscriber_user_twitch,
  odd_normal_user_twitch
) => {
  streamer_id = String(streamer_id)
  raffle_id = String(raffle_id)

  if (!raffles[streamer_id]) {
    raffles[streamer_id] = {}
  }
  if (!raffles[streamer_id][raffle_id]) {
    raffles[streamer_id][raffle_id] = {
      id: raffle_id,
      streamer_id: streamer_id,
      odd_subscriber_user_twitch: odd_subscriber_user_twitch,
      odd_normal_user_twitch: odd_normal_user_twitch,
      participants: [],
      word_to_participate: "!sorteio",
    }
  }

  return raffles[streamer_id][raffle_id]
}

const create = (streamer_id, streamer_username) => {
  const raffle_id = uuidv4()

  const raffle = addRaffle(streamer_id, streamer_username)

  console.log(`${streamer_username} JUST CREATED THE RAFFLE ${raffle_id}`)

  const listener = new tmi.Client({
    channels: [streamer_username],
  })

  listener.connect()

  listener.on("message", (channel, tags, message, self) => {
    console.log("###########")
    console.log(tags)
    console.log(message)
    console.log("###########")

    const isAlreadyParticipanting = raffle.participants.some(
      (user) => user["user_id"] === tags["user-id"]
    )

    if (isAlreadyParticipanting) return

    if (message.includes(raffle["word_to_participate"])) {
      console.log(
        `${tags["username"]} JUST ENJOYED ON RAFFLE ${raffle_id} OF STREAMER ${streamer_username}`
      )

      raffle.participants.push({
        user_id: tags["user-id"],
        is_subscriber: tags["subscriber"],
        user_username: tags["username"],
      })
    }
  })

  listener.on("connected", (address, port) => {
    console.log(`CONNECTED ${address}:${port} - ${streamer}`)
  })

  setTimeout(() => {
    listener.disconnect().then(
      () => {
        console.log(
          `SUCCESS ON DISCONNECT, STREAMER: ${streamer_username} - RAFFLE: ${raffle_id} - AT ${moment().toISOString()}`
        )
      },
      () => {
        console.log(
          `ERROR ON DISCONNECT, STREAMER: ${streamer_username} - RAFFLE: ${raffle_id} - AT ${moment().toISOString()}`
        )
      }
    )
  }, 1000 * 60 * 60 * 4)
}

module.exports = { create }
