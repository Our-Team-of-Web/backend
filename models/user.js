const mongoose=require('mongoose')

const userSchema=mongoose.Schema({
 name:{
  type:String,
  required:true,
 },
 email:{
  type:String,
  required:true,
 },
 password:{
  type:String,
  required:true,
 },
 solved:{
  type:Array,
  default:[],
 },
 added:{
  type:Array,
  default:[],
 },
 createdAt:{
  type:Date,
  default:Date.now(),
 }
})

module.exports=mongoose.model("User",userSchema)