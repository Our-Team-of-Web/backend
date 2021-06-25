const router = require('express').Router()
const verify = require('./authVerify')
const Problem = require('../models/problem')
const Joi = require('joi')

const postSchema = Joi.object().keys({
  name: Joi.string().required(),
  statement: Joi.string().required(),
  difficultyLevel: Joi.string().valid('EASY', 'MEDIUM', 'HARD'),
})

const updateSchema = Joi.object().keys({
  name: Joi.string().required(),
  statement: Joi.string().required(),
  difficultyLevel: Joi.string().valid('EASY', 'MEDIUM', 'HARD'),
})

router.get('/', async (req, res) => {
  try {
    const problems = await Problem.find()
    res.status(200).json({
      status: 'success',
      problems: problems,
    })
  } catch (error) {
    res.status(500).json({
      err: error,
    })
  }
})

router.get('/:id', verify, async (req, res) => {
  try {
    const problem = await Problem.findOne({ _id: req.params.id })
    if (!problem) {
      return res.status(400).json({
        err: 'Problem not found',
      })
    }
    res.status(200).json({
      status: 'success',
      problem: problem,
    })
  } catch (error) {
    res.status(500).json({
      err: error,
    })
  }
})

router.post('/', verify, async (req, res) => {
  const problemExist = await Problem.findOne({ name: req.body.name })
  if (problemExist) {
    return res.status(400).json({
      err: 'problem already exist',
    })
  }
  const { error, value } = postSchema.validate(req.body)
  if (error) {
    return res.status(400).json({
      err: error.details[0].message,
    })
  }

  const problem = new Problem({
    name: req.body.name,
    statement: req.body.statement,
    difficultyLevel: req.body.difficultyLevel,
    createdBy: req.user._id,
  })

  try {
    const savedProblem = await problem.save()
    res.status(200).json({
      status: 'success',
      problem: savedProblem,
    })
  } catch (error) {
    res.status(500).json({
      err: error,
    })
  }
})

router.patch('/:id', verify, async (req, res) => {
  try {
    const problem = await Problem.findOne({ _id: req.params.id })
    if (!problem) {
      return res.status(400).json({
        err: 'problem not found',
      })
    }
    if (req.user._id !== problem.createdBy) {
      return res.status(400).json({
        err: 'Not authorized to modify',
      })
    }
    await Problem.findOneAndUpdate({ _id: req.params.id }, req.body)
    const updatedProblem = await Problem.findOne({ _id: req.params.id })
    res.status(200).json({
      status: 'success',
      problem: updatedProblem,
    })
  } catch (error) {
    res.status(500).json({
      err: error,
    })
  }
})

router.delete('/:id', verify, async (req, res) => {
  try {
    const problem = await Problem.findOne({ _id: req.params.id })
    if (!problem) {
      return res.status(400).json({
        err: 'problem not found',
      })
    }
    if (req.user._id !== problem.createdBy) {
      return res.status(400).json({
        err: 'Not authorized to delete',
      })
    }
    await Problem.deleteOne({ _id: req.params.id })
    res.status(200).json({
      status: 'sucess',
    })
  } catch (error) {
    res.status(500).json({
      err: error,
    })
  }
})

module.exports = router
