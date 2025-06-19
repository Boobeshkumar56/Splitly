const moogoose=require('mongoose')
const connectDB=async()=>{
    try {
        await moogoose.connect(process.env.MONGO_URL);
        console.log("MONGODB connected ")
        
    } catch (error) {
        console.log(error.message);
        process.exit(0)
    }
    
}
module.exports=connectDB;