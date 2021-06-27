const mongoose = require('mongoose')

const problemSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  statement: {
    type: String,
    required: true,
  },
  difficultyLevel: {
    type: String,
    enum: ['EASY', 'MEDIUM', 'HARD'],
    default: 'EASY',
  },
  inputFormat: {
    type: String,
    required: true,
  },
  outputFormat: {
    type: String,
    required: true,
  },
  tags: {
    type: String,
    enum: [
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
      'searching',
    ],
    default: 'array',
  },
  sampleOutput: {
    type: String,
    required: true,
  },
  sampleInput: {
    type: String,
    required: true,
  },
  output: {
    type: String,
    required: true,
  },
  input: {
    type: String,
    required: true,
  },
  createdBy: {
    type: String,
  },
})

module.exports = mongoose.model('Problem', problemSchema)
