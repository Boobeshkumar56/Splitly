
const moogoose=require('mongoose')
const UserSchema=new moogoose.Schema(
    {
        username:{type:String , required:true},
        password:{type:String,required:true},
        email:{type:String,required:true,unique:true},
        
    },{timestamps:true}
)
module.exports=moogoose.model('User',UserSchema);