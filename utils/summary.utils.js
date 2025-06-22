
const Expense = require('../models/Expenses.model');
const User = require('../models/User.model');
const Group=require('../models/Group.model')

const calculateGroupSummary = async (groupId) => {
  const expenses = await Expense.find({ group: groupId }).populate('payer').lean();
  const group = await Group.findById(groupId);

console.log(group.groupname)
  let totalSpent = 0;
  const categoryBreakdown = {};
  const contributions = {};
  const owedMap = {};

  for (const expense of expenses) {
    totalSpent += expense.amount;

    if (expense.category) {
      categoryBreakdown[expense.category] = (categoryBreakdown[expense.category] || 0) + expense.amount;
    }

    const payerId = expense.payer._id.toString();
    contributions[payerId] = (contributions[payerId] || 0) + expense.amount;

    for (const p of expense.participants) {
      const participantId = p.user.toString();
      owedMap[participantId] = (owedMap[participantId] || 0) + p.share;
    }
  }

  let topSpenderId = null;
  let topAmount = -1;
  for (const userId in contributions) {
    if (contributions[userId] > topAmount) {
      topAmount = contributions[userId];
      topSpenderId = userId;
    }
  }

  const topSpenderUser = await User.findById(topSpenderId);

  const allUserIds = Array.from(new Set([...Object.keys(contributions), ...Object.keys(owedMap)]));
  const users = await User.find({ _id: { $in: allUserIds } }).lean();
  console.log(users)

  const userContributions = users.map(user => ({
    user: user?.username || user?.email,
    amountPaid: contributions[user._id.toString()] || 0,
    amountOwed: owedMap[user._id.toString()] || 0
  }));

  return {
    groupName: group?.groupname || 'Unknown Group',
    totalSpent,
    topSpender: {
      user: topSpenderUser?.username || 'Unknown',
      amount: contributions[topSpenderId] || 0
    },
    categoryBreakdown,
    userContributions
  };
};

module.exports = calculateGroupSummary ;
