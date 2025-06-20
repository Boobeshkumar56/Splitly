const Group=require('../models/Group.model')
const User=require('../models/User.model')
const Balance=require('../models/Balance.model')

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
