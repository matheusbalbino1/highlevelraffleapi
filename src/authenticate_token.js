const jwt = require("jsonwebtoken")

const SECRET_KEY =
  process.env.TOP_SECRET_KEY || "MAY_I_DONT_KNOW_IT_BUT_I_KNOW_HOW_TO_LEARN_IT"

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (token == null) return res.sendStatus(401)

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403)
    req.user = user
    next()
  })
}

module.exports = { SECRET_KEY, authenticateToken }
