const express=require('express')
const router=express.Router();
const groupcontroller=require('../controllers/Group.control')
const verifytoken=require('../middlewares/auth.middleware')

router.post('/Creategroup',verifytoken,groupcontroller.Creategroup)
router.post('/:groupId/add-member', verifytoken, groupcontroller.addMember);
router.post('/:groupId/remove-member', verifytoken, groupcontroller.removeMember);
router.post('/:groupId/update-role', verifytoken, groupcontroller.updateRole);
router.get('/:groupId/balances', verifytoken, groupcontroller.getGroupBalances);

module.exports=router