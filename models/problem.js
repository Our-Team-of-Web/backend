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
  },
  sampleInput: {
    type: String,
  },
  output: {
    type: String,
  },
  Input: {
    type: String,
  },
  createdBy: {
    type: String,
  },
})

module.exports = mongoose.model('Problem', problemSchema)
