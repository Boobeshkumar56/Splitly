const mongoose=require('mongoose')
const GroupSchema=new mongoose.Schema(
    {
        groupname:{type:String,required:true},
        description:{type:String,required:false},
        members:[{
            user:{type:mongoose.Schema.Types.ObjectId,ref:'User'},
            role:{type:String,enum:['admin','member','viewer'],default:'member'}
        }]

    },{timestamps:true})
module.exports=mongoose.model('Group',GroupSchema);
