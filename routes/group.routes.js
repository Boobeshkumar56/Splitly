const express=require('express')
const router=express.Router();
const groupcontroller=require('../controllers/Group.control')
const verifytoken=require('../middlewares/auth.middleware')
const qrController=require("../controllers/qr.control")
router.post('/Creategroup',verifytoken,groupcontroller.Creategroup)
router.post('/:groupId/add-member', verifytoken, groupcontroller.addMember);
router.post('/:groupId/remove-member', verifytoken, groupcontroller.removeMember);
router.post('/:groupId/update-role', verifytoken, groupcontroller.updateRole);
router.get('/:groupId/balances', verifytoken, groupcontroller.getGroupBalances);
router.get('/:groupId/optimalbalance',verifytoken,groupcontroller.getoptimalbalance)
router.get('/:groupId/summary', verifytoken, groupcontroller.getGroupSummary);
router.get('/:groupId/Exportpdf', verifytoken, groupcontroller.exportGroupSummaryPDF);
router.get('/:groupId/invite-qr', qrController.generateInvitationQR);
router.get('/:groupId/payment-qr', qrController.generatePaymentQR);
router.get('/:groupId/join-group', groupcontroller.joinGroupViaQR);
module.exports=router