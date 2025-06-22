const Group = require('../models/Group.model');
const User = require('../models/User.model');
const Balance = require('../models/Balance.model');
const Expense = require('../models/Expenses.model');
const generateGroupSummaryPDF = require('../utils/pdf.utils');
const calculateGroupSummary = require('../utils/summary.utils');
const { optimizeSettlements } = require('../utils/optimizedbalance.utils');
const path = require('path');
const fs = require('fs');

const getUserRoleInGroup = (group, userId) => {
  if (!group || !Array.isArray(group.members) || !userId) return null;

  const member = group.members.find((m) => {
    if (!m || !m.user) return false;

    const memberId = m.user.toString?.();
    const targetId = userId.toString?.();

    return memberId && targetId && memberId === targetId;
  });

  return member ? member.role : null;
};




exports.Creategroup = async (req, res) => {
  try {
    const { groupname, description } = req.body;
    const group = new Group({
      groupname,
      description,
      members: [{ user: req.user, role: 'admin' }]
    });
    await group.save();
    res.status(201).json({ message: 'Group created' });
  } catch (error) {
    console.log('Error in creating group', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.addMember = async (req, res) => {
  const { groupId } = req.params;
  const { userId, role } = req.body;
  const group = await Group.findById(groupId);
  if (!group) return res.status(404).json({ message: 'Group not found' });

  const requesterRole = getUserRoleInGroup(group, req.user._id);
  if (requesterRole !== 'admin')
    return res.status(403).json({ message: 'Only admins can add members' });

  const already_member = group.members.some((e) => e.user?.toString() === userId);
  if (already_member)
    return res.status(400).json({ message: 'User already in the group' });

  group.members.push({ user: userId, role: role || 'member' });
  await group.save();
  const user = await User.findById(userId);
  res.status(200).json({ message: `${user.username} added to the group` });
};

exports.removeMember = async (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.body;

  const group = await Group.findById(groupId);
  if (!group) return res.status(404).json({ message: 'Group not found' });

  const requesterRole = getUserRoleInGroup(group, req.user._id);
  if (requesterRole !== 'admin')
    return res.status(403).json({ message: 'Only admins can remove members' });

  group.members = group.members.filter((m) => m.user?.toString() !== userId);
  await group.save();
  res.status(200).json({ message: 'Member removed' });
};

exports.updateRole = async (req, res) => {
  const { groupId } = req.params;
  const { userId, role } = req.body;

  const group = await Group.findById(groupId);
  if (!group) return res.status(404).json({ message: 'Group not found' });

  const requesterRole = getUserRoleInGroup(group, req.user._id);
  if (requesterRole !== 'admin')
    return res.status(403).json({ message: 'Only admins can change roles' });

  const member = group.members.find((m) => m.user?.toString() === userId);
  if (!member) return res.status(404).json({ message: 'User not a member' });

  member.role = role;
  await group.save();
  res.status(200).json({ message: 'Role updated', group });
};

exports.getGroupBalances = async (req, res) => {
  try {
    const balances = await Balance.find({ group: req.params.groupId })
      .populate('from', 'username')
      .populate('to', 'username');

    const formatted = balances.map(b => ({
      from: b.from.username,
      to: b.to.username,
      amount: b.amount.toFixed(2)
    }));

    res.status(200).json({ balances: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch balances', error: error.message });
  }
};

exports.getoptimalbalance = (req, res) => {
  const { balances } = req.body;
  if (!balances || !Array.isArray(balances)) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const netMap = {};
  balances.forEach(({ from, to, amount }) => {
    const amt = parseFloat(amount);
    if (!netMap[from]) netMap[from] = 0;
    if (!netMap[to]) netMap[to] = 0;
    netMap[from] -= amt;
    netMap[to] += amt;
  });

  const netBalances = Object.entries(netMap)
    .map(([user, amount]) => ({
      user,
      amount: Math.round(amount * 100) / 100
    }))
    .filter(entry => Math.abs(entry.amount) >= 0.01);

  const optimized = optimizeSettlements(netBalances);
  res.json({ optimized });
};

exports.getGroupSummary = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    const expenses = await Expense.find({ group: groupId }).populate('payer').lean();

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
    const users = await User.find({ _id: { $in: allUserIds } });

    const userContributions = users.map(user => ({
      user: user.username,
      amountPaid: contributions[user._id.toString()] || 0,
      amountOwed: owedMap[user._id.toString()] || 0
    }));

    res.json({
      groupName: group?.groupname || 'Unknown Group',
      totalSpent,
      topSpender: {
        user: topSpenderUser?.username || 'Unknown',
        amount: contributions[topSpenderId] || 0
      },
      categoryBreakdown,
      userContributions
    });
  } catch (err) {
    res.status(500).json({ message: 'Error generating summary', error: err.message });
  }
};

exports.exportGroupSummaryPDF = async (req, res) => {
  try {
    const { groupId } = req.params;
    const summary = await calculateGroupSummary(groupId);
    const filename = `summary-${groupId}.pdf`;
    const exportDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir);
    const fullPath = path.join(exportDir, filename);
    await generateGroupSummaryPDF(summary, filename, fullPath);
    res.download(fullPath, filename);
  } catch (error) {
    res.status(500).json({ message: 'Failed to export PDF', error: error.message });
  }
};

exports.joinGroupViaQR = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'Missing userId in query' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const alreadyMember = group.members.some((m) => m.user?.toString() === userId);
    if (alreadyMember) {
      return res.status(200).json({ message: 'User already in group' });
    }

    group.members.push({ user: userId, role: 'viewer' });
    await group.save();

    res.status(200).json({ message: 'User joined as viewer', role: 'viewer', group });
  } catch (err) {
    res.status(500).json({ message: 'Failed to join group', error: err.message });
  }
};