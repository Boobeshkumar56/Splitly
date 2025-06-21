const { sendNotification } = require('../utils/notification.utils');

// Notify all participants
for (const p of expense.participants) {
  if (p.user.toString() !== payer.toString()) {
    await sendNotification(p.user, `You owe ₹${p.share} for '${description}'`, 'expense');
  }
}
