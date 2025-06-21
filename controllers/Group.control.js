const Group=require('../models/Group.model')
const User=require('../models/User.model')
const Balance=require('../models/Balance.model')
const generateGroupSummaryPDF = require('../utils/pdf.utils');
const path = require('path');
const Expense=require("../models/Expenses.model")
const calculateGroupSummary=require('../utils/summary.utils')

const fs=require('fs')
exports.Creategroup=async(req,res)=>{
    try {
        const {groupname,description,}=req.body;

    const group=new Group({groupname,description,members:[
        {
            user:req.user,
            role:'admin'//making the creator as admin

        }

    ]})
    await group.save();
    res.status(201).json({message:"Group created"});
        
    } catch (error) {
        console.log("Error in creating group",error.message)
        res.status(500).json({message:"Internal server error"})
        
    }
}
exports.addMember=async(req,res)=>{
    const {groupId}=req.params;
    const {userId,role}=req.body;
    const user = await User.findById(userId);
    const group=await Group.findById(groupId);
    if(!group)return res.status(404).json({message:"Group is not available"})
    const already_member=group.members.some((e)=>e.user?.toString()==userId);
    if(already_member)
        return res.status(400).json({message:"User already in the group"})
    group.members.push({user:userId,role:role||'member'});
    await group.save();
    res.status(200).json({message:`${user.username} added to the group`})
}
exports.removeMember = async (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.body;

  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    group.members = group.members.filter((m) => m.user?.toString() !== userId);
    await group.save();
    res.status(200).json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ message: 'Error removing member', error: err.message });
  }
};

// Change member role
exports.updateRole = async (req, res) => {
  const { groupId } = req.params;
  const { userId, role } = req.body;

  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const member = group.members.find((m) => m.user?.toString() === userId);
    if (!member) return res.status(404).json({ message: 'User not a member' });

    member.role = role;
    await group.save();
    res.status(200).json({ message: 'Role updated', group });
  } catch (err) {
    res.status(500).json({ message: 'Error updating role', error: err.message });
  }
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
exports.getGroupSummary = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group=Group.findOne(groupId)
    console.log(group.groupname)
    // Fetch all expenses of the group with populated payer info
    const expenses = await Expense.find({ group: groupId }).populate('payer').lean();

    let totalSpent = 0;
    const categoryBreakdown = {};
    const contributions = {}; // { userId: amountPaid }
    const owedMap = {};       // { userId: amountOwed }

    for (const expense of expenses) {
      totalSpent += expense.amount;

      // Category Breakdown
      if (expense.category) {
        categoryBreakdown[expense.category] = (categoryBreakdown[expense.category] || 0) + expense.amount;
      }

      // Contributions by payer
      const payerId = expense.payer._id.toString();
      contributions[payerId] = (contributions[payerId] || 0) + expense.amount;

      // Owed amounts by participants
      for (const p of expense.participants) {
        const participantId = p.user.toString();
        owedMap[participantId] = (owedMap[participantId] || 0) + p.share;
      }
    }

    // Top Spender logic
    let topSpenderId = null;
    let topAmount = -1;
    for (const userId in contributions) {
      if (contributions[userId] > topAmount) {
        topAmount = contributions[userId];
        topSpenderId = userId;
      }
    }

    const topSpenderUser = await User.findById(topSpenderId);

    // Final user contributions list
    const allUserIds = Array.from(new Set([
      ...Object.keys(contributions),
      ...Object.keys(owedMap)
    ]));

    const users = await User.find({ _id: { $in: allUserIds } });

    const userContributions = users.map(user => ({
      user: user.name,
      amountPaid: contributions[user._id.toString()] || 0,
      amountOwed: owedMap[user._id.toString()] || 0
    }));
    
    // Final response
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

    // Ensure the directory exists
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

    const alreadyMember = group.members.some(m => m.user?.toString() === userId);
    if (alreadyMember) {
      return res.status(200).json({ message: 'User already in group' });
    }

    group.members.push({ user: userId, role: 'member' });
    await group.save();

    res.status(200).json({ message: 'User successfully joined the group', group });
  } catch (err) {
    res.status(500).json({ message: 'Failed to join group', error: err.message });
  }
};
