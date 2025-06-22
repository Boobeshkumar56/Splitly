const Balance=require('../models/Balance.model')
const {updateBalanceOnSettlement}=require('./balances.utils')
function optimizeSettlements(balances) {
  const debtors = [];
  const creditors = [];
  const result = [];

  // Separate debtors and creditors
  for (const { user, amount } of balances) {
    if (amount < 0) debtors.push({ user, amount: -amount }); // make positive
    else if (amount > 0) creditors.push({ user, amount });
  }

  let i = 0, j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const amount = Math.min(debtor.amount, creditor.amount);

    result.push({
      from: debtor.user,
      to: creditor.user,
      amount: Math.round(amount * 100) / 100
    });

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount === 0) i++;
    if (creditor.amount === 0) j++;
  }

  return result;
}

function buildGraph(balances) {
  const graph = {};
  for (let{ from, to, amount } of balances) {
    from=from.toString();
    to=to.toString();
    if (!graph[from]) graph[from] = [];
    graph[from].push({ to, amount: parseFloat(amount) });
  }
  return graph;
}

// Trace the path from sender to receiver
function tracePath(graph, start, end, visited = new Set(), path = []) {
  if (start === end) return [...path, end];
  visited.add(start);

  for (const neighbor of graph[start] || []) {
    if (!visited.has(neighbor.to)) {
      const result = tracePath(graph, neighbor.to, end, visited, [...path, start]);
      if (result) return result;
    }
  }

  return null;
}
async function performOptimalSettlement(groupId, sender, receiver, amount) {
  const balances = await Balance.find({ group: groupId}).lean();

  const graph = buildGraph(balances);
  const path = tracePath(graph, sender.toString(), receiver.toString());

  if (!path || path.length < 2) {
    throw new Error('No valid path found for settlement');
  }

  const settlements = [];

  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];

    // Step 1: Create new settlement entry
    const newSettlement = new Balance({
      from,
      to,
      amount,
      group: groupId,
      note: 'Optimal Settlement'
     
    });

    await newSettlement.save();
    settlements.push(newSettlement);

    // Step 2: Reduce existing balances
    await updateBalanceOnSettlement(groupId, from, to, amount);
  }

  return {
    message: 'Optimal settlement completed',
    path,
    settlements
  };
}
module.exports = {optimizeSettlements,tracePath,buildGraph,performOptimalSettlement};
