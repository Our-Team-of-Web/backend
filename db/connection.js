const mongoose=require('mongoose')
const dotenv=require('dotenv')

dotenv.config()

mongoose.connect(process.env.DB_URI,{
 useNewUrlParser:true,
 useUnifiedTopology:true,
 useFindAndModify: false
})
.then(()=>{
 console.log(`mongodb connected!`)
})
.catch(err=>console.log(`${err}`))