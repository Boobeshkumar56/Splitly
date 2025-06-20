const User=require('../models/User.model')
const bcrypt=require('bcryptjs')
const jwt=require("jsonwebtoken")
exports.register=async(req,res)=>{
    try {
        const {username,password,email}=req.body;
        const emailExists=await User.findOne({email})
        if(emailExists) return res.status(400).json({message:"User email already registered"});
        const hashedpassword=await bcrypt.hash(password,12)
        const user=new User({username,password:hashedpassword,email})
        await user.save();
        res.status(201).json({message:"User created successfully"})
    } catch (error) {
        res.status(500).json({message:"Internal server error"})
    }
}
exports.Login=async(req,res)=>{
    try {
        const {email,password}=req.body;
        const user=await User.findOne({email})
        if(!user)return res.status(404).json({message:"user not found"})
        const passwordmatch=bcrypt.compare(password, user.password)
        if(!passwordmatch) return res.status(400).json({message:"Invalid password"})
        const token=jwt.sign({_id:user._id,name:user.name},process.env.JWT_SECRET,{expiresIn:'7d'})
        res.json({token})
    } catch (error) {
        res.status(500).json({message:error.message})
    }
}