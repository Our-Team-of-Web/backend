const router = require('express').Router()
const verify = require('./authVerify')
const Problem = require('../models/problem')
const Joi = require('joi')
const axios = require('axios')
const User = require('../models/user')

const checkPresence = (arr, obj) => {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === obj) {
      console.log(arr[i])
      console.log(obj)
      return true
    }
  }
  return false
}

const postSchema = Joi.object().keys({
  name: Joi.string().required(),
  statement: Joi.string().required(),
  difficultyLevel: Joi.string().valid('EASY', 'MEDIUM', 'HARD'),
  tags: Joi.string().valid(
    'array',
    'string',
    'dp',
    'trees',
    'graph',
    'heap',
    'stack',
    'queue',
    'adhoc',
    'matrix',
    'hash',
    'bit manipulation',
    'number theory',
    'math',
    'trie',
    'sorting',
    'searching'
  ),
  sampleInput: Joi.string().required(),
  sampleOutput: Joi.string().required(),
  inputFormat: Joi.string().required(),
  outputFormat: Joi.string().required(),
})

const updateSchema = Joi.object().keys({
  name: Joi.string(),
  statement: Joi.string(),
  difficultyLevel: Joi.string().valid('EASY', 'MEDIUM', 'HARD'),
  tags: Joi.string().valid(
    'array',
    'string',
    'dp',
    'trees',
    'graph',
    'heap',
    'stack',
    'queue',
    'adhoc',
    'matrix',
    'hash',
    'bit manipulation',
    'number theory',
    'math',
    'trie',
    'sorting',
    'searching'
  ),
  sampleInput: Joi.string(),
  sampleOutput: Joi.string(),
  inputFormat: Joi.string(),
  outputFormat: Joi.string(),
})

router.get('/', async (req, res) => {
  const page = parseInt(req.query.page)
  const limit = parseInt(req.query.limit)
  const diffLevel = req.query.difficultyLevel
  const tag = req.query.tags
  const index = (page - 1) * limit
  let filter = {}
  if (diffLevel) {
    filter.difficultyLevel = diffLevel
  }
  if (tag) {
    filter.tags = tag
  }
  try {
    if (Object.keys(filter).length === 0) {
      const problems = await Problem.find().limit(limit).skip(index).exec()
      res.status(200).json({
        status: 'success',
        problems: problems,
      })
    } else {
      const problems = await Problem.find(filter)
        .limit(limit)
        .skip(index)
        .exec()
      res.status(200).json({
        status: 'success',
        problems: problems,
      })
    }
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

router.post('/:id', verify, async (req, res) => {
  const problem = await Problem.findOne({ _id: req.params.id })
  const user = await User.findOne({ _id: req.user._id })
  const input = problem.input
  axios
    .post('https://api.jdoodle.com/v1/execute', {
      script: req.body.script,
      language: req.body.language,
      stdin: input,
      versionIndex: req.body.versionIndex,
      clientId: process.env.JD_Client_ID,
      clientSecret: process.env.JD_Client_Secret,
    })
    .then((response) => {
      const outputString = response.data.output
      if (
        outputString.includes('error') ||
        outputString.includes('warning') ||
        outputString.includes('Timeout')
      ) {
        return res.status(200).json({
          status: 'success',
          op: response.data,
        })
      }
      const outputStringCompare = outputString.substring(
        9,
        outputString.length - 1
      )
      const actualOutput = problem.output
      const actualOutputRes = actualOutput.slice(0, -1)
      console.log(actualOutputRes)
      console.log(`size:${actualOutputRes.length}`)
      console.log(outputStringCompare)
      console.log(`size:${outputStringCompare.length}`)
      if (actualOutputRes === outputStringCompare) {
        if (
          !checkPresence(user.solved, {
            id: problem._id,
            name: problem.name,
            tags: problems.tags,
          })
        ) {
          User.updateOne(
            { _id: req.user._id },
            {
              $push: {
                solved: [
                  { id: problem._id, name: problem.name, tags: problem.tags },
                ],
              },
            },
            (err, result) => {
              if (err) {
                return res.status(400).json({
                  err: err,
                })
              }
              return res.status(200).json({
                status: 'success',
                op: 'AC',
              })
            }
          )
        }
        /*return res.status(200).json({
          status: 'success',
          op: 'AC',
        })*/
      } else {
        return res.status(200).json({
          status: 'success',
          op: 'WA',
        })
      }
    })
    .catch((error) => {
      res.status(500).json({
        err: error,
      })
    })
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

  const user = await User.findById(req.user._id)
  /*if (user.solved.length < 2) {
    return res.status(400).json({
      err: 'Not eligible to upload problem',
    })
  }*/
  if (
    !req.files.input.name.includes('.txt') ||
    !req.files.output.name.includes('.txt')
  ) {
    return res.status(400).json({
      err: 'File input should be .txt',
    })
  }
  const input = req.files.input.data.toString()
  const output = req.files.output.data.toString()
  const problem = new Problem({
    name: req.body.name,
    statement: req.body.statement,
    difficultyLevel: req.body.difficultyLevel,
    tags: req.body.tags,
    sampleInput: req.body.sampleInput,
    sampleOutput: req.body.sampleOutput,
    input: input,
    output: output,
    inputFormat: req.body.inputFormat,
    outputFormat: req.body.outputFormat,
    createdBy: req.user._id,
  })

  try {
    const savedProblem = await problem.save()
    User.updateOne(
      { _id: req.user._id },
      {
        $push: {
          problemAdded: [
            {
              id: savedProblem._id,
              name: savedProblem.name,
              tags: savedProblem.tags,
            },
          ],
        },
      },
      (err, result) => {
        if (err) {
          res.status(400).json({
            err: err,
          })
        }
      }
    )
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
  const { error, value } = updateSchema.validate(req.body)
  if (error) {
    return res.status(400).json({
      err: error.details[0].message,
    })
  }
  const upd = {}
  if (req.body !== null) {
    for (const [key, value] of Object.entries(req.body)) {
      upd[key] = value
    }
  }
  if (req.files !== null) {
    for (const [key, value] of Object.entries(req.files)) {
      const temporary = value.data.toString()
      upd[key] = temporary
    }
  }
  try {
    const updatedProblem = await Problem.findOneAndUpdate(
      { _id: req.params.id },
      upd,
      {
        new: true,
      }
    )
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
