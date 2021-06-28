const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/user')
const Joi = require('joi')
const dotenv = require('dotenv')
const verify = require('./authVerify')

dotenv.config()

const regdSchema = Joi.object().keys({
  name: Joi.string().min(5).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(20).required(),
})

const updateSchema = Joi.object().keys({
  name: Joi.string().min(5).max(30),
  email: Joi.string().email(),
})

const passwordSchema = Joi.object().keys({
  old_password: Joi.string().min(6).max(20).required(),
  new_password: Joi.string().min(6).max(20).required(),
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
        expiresIn: '2hr',
      },
      { algorithm: 'RS256' }
    )
    res.header('auth-token', access_token).status(200).json({
      status: 'success',
      access_token: access_token,
      id: user._id,
    })
  } catch (error) {
    res.status(500).json({
      err: error,
    })
  }
})

router.patch('/:id', verify, async (req, res) => {
  const { error, value } = updateSchema.validate(req.body)
  if (error) {
    return res.status(400).json({
      err: error.details[0].message,
    })
  }
  const user = await User.findOne({ _id: req.params.id })
  if (!user) {
    return res.status(400).json({
      err: 'user not found',
    })
  }
  if (req.user._id !== user._id.toString()) {
    return res.status(400).json({
      err: 'Not authorized to modify',
    })
  }
  const upd = {}
  if (req.body !== null) {
    for (const [key, value] of Object.entries(req.body)) {
      upd[key] = value
    }
  }
  try {
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.params.id },
      upd,
      { new: true }
    )
    res.status(200).json({
      status: 'success',
      user: updatedUser,
    })
  } catch (error) {
    res.status(500).json({
      err: error,
    })
  }
})

router.patch('/password/:id', verify, async (req, res) => {
  const { error, value } = passwordSchema.validate(req.body)
  if (error) {
    return res.status(400).json({
      err: error.details[0].message,
    })
  }
  const user = await User.findOne({ _id: req.params.id })
  if (!user) {
    return res.status(400).json({
      err: 'user not found',
    })
  }
  if (req.user._id !== user._id.toString()) {
    return res.status(400).json({
      err: 'Not authorized to modify',
    })
  }
  const validPassword = await bcrypt.compare(
    req.body.old_password,
    user.password
  )
  if (!validPassword) {
    return res.status(400).json({
      err: 'Incorrect password',
    })
  }
  const salt = await bcrypt.genSalt(12)
  const hashedPassword = await bcrypt.hash(req.body.new_password, salt)
  const samePassword = await bcrypt.compare(
    req.body.old_password,
    hashedPassword
  )
  if (samePassword) {
    return res.status(400).json({
      err: 'previous password is used again',
    })
  }
  const upd = {
    password: hashedPassword,
  }
  try {
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.params.id },
      upd,
      { new: true }
    )
    updatedUser['password'] = undefined
    res.status(200).json({
      status: 'success',
      user: updatedUser,
    })
  } catch (error) {
    res.status(500).json({
      err: error,
    })
  }
})

router.get('/added/:id', verify, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id })
    if (!user) {
      return res.status(400).json({
        err: 'user not found',
      })
    }
    if (req.user._id !== user._id.toString()) {
      return res.status(400).json({
        err: 'Not authorized to show',
      })
    }
    res.status(200).json({
      status: 'success',
      problems: user.problemAdded,
    })
  } catch (err) {
    res.status(500).json({
      err: error,
    })
  }
})

router.get('/solved/:id', verify, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id })
    if (!user) {
      return res.status(400).json({
        err: 'user not found',
      })
    }
    if (req.user._id !== user._id.toString()) {
      return res.status(400).json({
        err: 'Not authorized to modify',
      })
    }
    res.status(200).json({
      status: 'success',
      problems: user.solved,
    })
  } catch (error) {
    res.status(500).json({
      err: error,
    })
  }
})

module.exports = router
