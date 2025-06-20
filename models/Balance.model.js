// models/Balance.model.js
const mongoose = require('mongoose');

const BalanceSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // debtor
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },   // creditor
  amount: { type: Number, required: true }, // how much 'from' owes 'to'
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Balance', BalanceSchema);
