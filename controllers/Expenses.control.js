const Expense = require('../models/Expenses.model');
const Group = require('../models/Group.model');
const {sendNotification}=require('../utils/notification.utils')
const {updateBalancesOnExpense}=require("../utils/balances.utils")
exports.addExpense = async (req, res) => {
  try {
    const { groupId, payer, amount, description, category, splitType, participants } = req.body;

    if (!groupId || !payer || !amount || !splitType || !participants || !participants.length) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const groupMemberIds = group.members.map((m) => m.user?.toString());
    const allValid = participants.every((p) => {
      const id = typeof p === 'string' ? p : p.user;
      return groupMemberIds.includes(id);
    });

    if (!allValid) return res.status(403).json({ message: 'One or more users not in group' });

    let splitShares = [];

    switch (splitType) {
      case 'equal': {
        const share = parseFloat((amount / participants.length).toFixed(2));
        splitShares = participants.map((p) => ({
          user: typeof p === 'string' ? p : p.user,
          share
        }));
        break;
      }

      case 'unequal': {
        const total = participants.reduce((sum, p) => sum + Number(p.share), 0);
        if (total !== amount) {
          return res.status(400).json({ message: 'Sum of shares must equal total amount' });
        }
        splitShares = participants.map((p) => ({
          user: p.user,
          share: Number(p.share)
        }));
        break;
      }

      case 'exact': {
        const total = participants.reduce((sum, p) => sum + Number(p.share), 0);
        if (total !== amount) {
          return res.status(400).json({ message: 'Sum of exact shares must equal total amount' });
        }
        splitShares = participants.map((p) => ({
          user: p.user,
          share: Number(p.share)
        }));
        break;
      }

      case 'share': {
        const totalShares = participants.reduce((sum, p) => sum + Number(p.shareCount), 0);
        if (!totalShares) return res.status(400).json({ message: 'Invalid share count' });

        splitShares = participants.map((p) => ({
          user: p.user,
          share: parseFloat(((p.shareCount / totalShares) * amount).toFixed(2))
        }));
        break;
      }
      case 'percentage': {
  const totalPercent = participants.reduce((sum, p) => sum + Number(p.percent), 0);
  if (totalPercent !== 100) {
    return res.status(400).json({ message: 'Total percentage must equal 100%' });
  }

  splitShares = participants.map((p) => ({
    user: p.user,
    share: parseFloat(((p.percent / 100) * amount).toFixed(2))
  }));
  break;
}


      default:
        return res.status(400).json({ message: 'Invalid split type' });
    }

    const expense = new Expense({
      group: groupId,
      payer,
      amount,
      description,
      category,
      splitType,
      participants: splitShares
    });

    await expense.save();
    await updateBalancesOnExpense(expense);
    for (const participant of expense.participants) {
  const participantId = participant.user.toString();
  if (participantId !== payer.toString()) {
    await sendNotification(
      participantId,
      `You owe ₹${participant.share} for "${expense.description}"`,
      'expense'
    );
  }}
  await sendNotification(
  payer,
  `Your expense of ₹${expense.amount} has been recorded for "${expense.description}"`,
  'info'
);
    res.status(201).json({ message: 'Expense added successfully', expense });
    

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding expense', error: err.message });
  }
};
