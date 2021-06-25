const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')

dotenv.config()

module.exports = (req, res, next) => {
  const token = req.header('auth-token')
  if (!token) {
    return res.status(401).json({
      err: 'Access denied',
    })
  }

  try {
    const verified = jwt.verify(token, process.env.TOKEN_SECRET)
    req.user = verified
    next()
  } catch (error) {
    return res.status(401).json({
      err: 'Invalid token',
    })
  }
}
