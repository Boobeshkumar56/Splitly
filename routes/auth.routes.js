const express=require('express');
const router=express.Router();
const authcontroller=require('../controllers/Auth.control')
router.post('/register',authcontroller.register);
router.post('/login',authcontroller.Login);
module.exports=router;