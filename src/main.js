const { v4: uuidv4 } = require("uuid")
const tmi = require("tmi.js")
const express = require("express")
const jwt = require("jsonwebtoken")
const { authenticateToken, SECRET_KEY } = require("./authenticate_token")
const { create } = require("./create_raffle")

const raffles = {}

const words_to_authenticated = []

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get("/api/random_word", (req, res) => {
  if (!req.query.streamer_username) {
    return res.status(400).json({
      message: "streamer_username is required",
    })
  }

  const streamer_username = req.query.streamer_username
  const word = `AUTENTICATION HIGHLEVELRAFFLE ${uuidv4()}`

  words_to_authenticated.push([streamer_username, word])

  return res.json({
    data: word,
  })
})

app.post("/api/login", async (req, res) => {
  const secret_word_to_authenticate = req.body.word
  const streamer_username = req.body.streamer_username

  if (!req.body.word || !req.body.streamer_username) {
    return res.status(400).json({
      message: "word e streamer_username are required",
    })
  }

  if (
    !words_to_authenticated.some(
      ([username, word]) =>
        username === streamer_username && word === secret_word_to_authenticate
    )
  ) {
    return res.status(400).json({
      message: "Unknown login attempt",
    })
  }

  const [authenticated, streamer_id] = await new Promise((resolve) => {
    const listener = new tmi.Client({
      channels: [streamer_username],
    })

    const desconectar = () => {
      listener.disconnect().then(
        () => {
          console.log(`SUCCESS ON DISCONNECT`)
        },
        () => {
          console.log(`ERROR ON DISCONNECT`)
        }
      )
    }

    listener.connect()

    listener.on("message", (channel, tags, message, self) => {
      if (message === secret_word_to_authenticate) {
        desconectar()
        resolve([true, tags["user-id"]])
      }
    })

    listener.on("connected", (address, port) => {
      console.log(`CONNECTED ${address}:${port} - ${streamer_username}`)
    })

    setTimeout(() => {
      desconectar()
      resolve([false, null])
    }, 1000 * 60 * 0.5)
  })

  if (authenticated) {
    const token = jwt.sign(
      {
        streamer_id: streamer_id,
        streamer_username: streamer_username,
      },
      SECRET_KEY,
      { expiresIn: "14d" }
    )

    return res.status(200).json({ token })
  } else {
    return res.status(400).json({
      message: "We couldn't validate your user. Please try again",
    })
  }
})

app.post("/api/raffle", authenticateToken, (req, res) => {
  const { streamer_id, streamer_username } = req.user

  create(streamer_id, streamer_username)

  res.json({
    data: {
      username,
      role,
      additionalData,
    },
  })
})

app.get("/api/raffle", authenticateToken, (req, res) => {
  const { streamer_id } = req.user

  res.json({
    data: raffles[streamer_id] || {},
  })
})

const PORT = 3000
app.listen(PORT, () => {
  console.log(`RUNNING ON PORT ${PORT}`)
})

module.exports = { raffles }
