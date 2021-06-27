const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/user')
const Joi = require('joi')
const dotenv = require('dotenv')

dotenv.config()

const regdSchema = Joi.object().keys({
  name: Joi.string().min(5).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(20).required(),
})

const loginSchema = Joi.object().keys({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(20).required(),
})

router.post('/register', async (req, res) => {
  const emailExist = await User.findOne({ email: req.body.email })
  if (emailExist) {
    return res.status(400).json({
      err: 'Email already exist!',
    })
  }

  const { error, value } = regdSchema.validate(req.body)
  if (error) {
    return res.status(400).json({
      err: error.details[0].message,
    })
  }

  const salt = await bcrypt.genSalt(12)
  const hashedPassword = await bcrypt.hash(req.body.password, salt)

  const user = new User({
    name: req.body.name,
    email: req.body.email,
    password: hashedPassword,
  })

  try {
    const savedUser = await user.save()
    savedUser['password'] = undefined
    res.status(200).json({
      status: 'user created',
      user: savedUser,
    })
  } catch (err) {
    res.status(500).json({
      err: error,
    })
  }
})

router.post('/login', async (req, res) => {
  const { error, value } = loginSchema.validate(req.body)
  if (error) {
    return res.status(400).json({
      err: error.details[0].message,
    })
  }
  const user = await User.findOne({ email: req.body.email })
  if (!user) {
    return res.status(400).json({
      err: "email doesn't exist",
    })
  }
  const validPassword = await bcrypt.compare(req.body.password, user.password)
  if (!validPassword) {
    return res.status(400).json({
      err: 'Incorrect password',
    })
  }

  try {
    const access_token = jwt.sign(
      { _id: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: '30m',
      },
      { algorithm: 'RS256' }
    )
    res.header('auth-token', access_token).status(200).json({
      status: 'success',
      access_token: access_token,
    })
  } catch (error) {
    res.status(500).json({
      err: error,
    })
  }
})

module.exports = router
