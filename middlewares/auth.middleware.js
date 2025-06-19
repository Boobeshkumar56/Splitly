const jwt=require('jsonwebtoken');
const verifytoken=(req,res,next)=>{
    const token=req.header('Authorization')?.split(' ')[1];
    if(!token) return res.status(401).json({message:"Access Denied"});
    try {
        
        const verified=jwt.verify(token,process.env.JWT_SECRET)
        req.user=verified;
        next()
    } catch (error) {
        res.status(400).json({message:"invalid token access"})
    }
}
module.exports=verifytoken;
