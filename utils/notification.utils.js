const Notification = require('../models/Notification.model');

const sendNotification = async (userId, content, type = 'info') => {
  return await Notification.create({ user: userId, content, type });
};

module.exports = { sendNotification };
