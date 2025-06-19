const express=require('express')
const dotenv=require('dotenv')
const connectDB=require('./config/db.config')
const cors=require('cors')
dotenv.config();
connectDB();
const app=express()
app.use(cors());
app.use(express.json())
app.use('/api/auth',require('./routes/auth.routes'));
app.use('/api/groups', require('./routes/group.routes'));

const PORT=process.env.PORT||5000
app.listen(PORT,()=>{
    console.log(`Server running on ${PORT}`)
});
