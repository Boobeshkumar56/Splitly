const Settlement = require('../models/Settlements.model');
const Group = require('../models/Group.model');
const {updateBalanceOnSettlement}=require('../utils/balances.utils')
const {sendNotification}=require('../utils/notification.utils')
exports.recordSettlement = async (req, res) => {
  try {
    const { group, from, to, amount, note } = req.body;

    if (!group || !from || !to || !amount) {
      return res.status(400).json({ message: 'some of the field are missing' });
    }

    // Check group exists
    const groupExists = await Group.findById(group);
    if (!groupExists) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const newSettlement = new Settlement({ group, from, to, amount, note });
     await updateBalanceOnSettlement(group, from, to, amount);
     await sendNotification(from, `You settled ₹${amount} with ${to}`, 'settlement');
      await sendNotification(to, `${from} paid you ₹${amount}`, 'settlement');

    await newSettlement.save();

    res.status(201).json({ message: 'Settlement recorded', settlement: newSettlement });
  } catch (err) {
    res.status(500).json({ message: 'Error recording settlement', error: err.message });
  }
};
exports.settleViaQR = async (req, res) => {
  try {
    const { from, to, amount} = req.query;
    let {note}=req.query;
    const { groupId } = req.params;
    const group=await Group.findOne({_id:groupId})
    if (!from || !to || !amount || !group) {
      return res.status(400).json({ message: 'Missing parameters' });
    }
    if(!note) note="paid using qr code"
    const newSettlement = new Settlement({ from, to, amount, group, note });
    await newSettlement.save();

    await updateBalanceOnSettlement(group, from, to, amount);

    res.status(201).json({ message: 'Payment settled via QR', settlement: newSettlement });
  } catch (error) {
    res.status(500).json({ message: 'Error settling payment', error: error.message });
  }
};