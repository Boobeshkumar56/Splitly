const Settlement = require('../models/Settlements.model');
const Group = require('../models/Group.model');
const {updateBalanceOnSettlement}=require('../utils/balances.utils')
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
    await newSettlement.save();

    res.status(201).json({ message: 'Settlement recorded', settlement: newSettlement });
  } catch (err) {
    res.status(500).json({ message: 'Error recording settlement', error: err.message });
  }
};
