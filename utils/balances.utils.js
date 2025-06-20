const Balance = require('../models/Balance.model');

const updateBalancesOnExpense = async (expense) => {
  const { group, payer, participants } = expense;

  for (const p of participants) {
    const participantId = p.user.toString();
    const share = p.share;

    if (participantId === payer.toString()) continue;

    const existing = await Balance.findOne({ group, from: participantId, to: payer });

    if (existing) {
      existing.amount += share;
      existing.lastUpdated = new Date();
      await existing.save();
    } else {
      await Balance.create({
        group,
        from: participantId,
        to: payer,
        amount: share
      });
    }
  }
};
const updateBalanceOnSettlement = async (group, from, to, amount) => {
  const existing = await Balance.findOne({ group, from, to });

  if (!existing) return;

  existing.amount -= amount;
  existing.lastUpdated = new Date();

  if (existing.amount <= 0.01) {
    await Balance.deleteOne({ _id: existing._id });
  } else {
    await existing.save();
  }
};

module.exports={updateBalanceOnSettlement,updateBalancesOnExpense}