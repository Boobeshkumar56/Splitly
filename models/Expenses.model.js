const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    payer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    category: { type: String, enum: ['Food', 'Travel', 'Utilities', 'Other'], default: 'Other' },
    splitType: { type: String, enum: ['equal', 'unequal', 'share', 'exact'], default: 'equal' },

    participants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        share: { type: Number } // how much this person owes
      }
    ],

    receipt: { type: String }, // image filename (optional)
    locked: { type: Boolean, default: false } // can be auto-locked after 7 days
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', ExpenseSchema);
