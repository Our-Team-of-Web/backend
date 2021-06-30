const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const fileUpload = require('express-fileupload')
const app = express()

dotenv.config()
app.use(fileUpload())
app.use(express.json())
app.use(cors())

require('./db/connection')

const authRoute = require('./routes/auth')
app.use('/users', authRoute)

const problemRoute = require('./routes/problemRoute')
app.use('/problems', problemRoute)

const port = process.env.PORT || 5000

app.listen(port, () => {
  console.log(`server is running on port:${port}`)
})

/*process.on('SIGTERM', () => {
  console.info('SIGTERM signal received.')
  console.log('Closing http server.')
  server.close(() => {
    console.log('Http server closed.')
    // boolean means [force], see in mongoose doc
    mongoose.connection.close(false, () => {
      console.log('MongoDb connection closed.')
      process.exit(0)
    })
  })
})*/
