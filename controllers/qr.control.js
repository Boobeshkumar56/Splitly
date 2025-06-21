// controllers/qr.controller.js
const path = require('path');
const fs = require('fs');
const generateQRCode = require('../utils/qr-code.utils');

exports.generateInvitationQR = async (req, res) => {
  try {
    const { groupId } = req.params;
    const inviteURL = `http://localhost/api/group/${groupId}/join-group`;

    const exportDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir);

    const filename = `invite-${groupId}.png`;
    const fullPath = path.join(exportDir, filename);
    await generateQRCode(inviteURL, fullPath);

    res.json({ url: inviteURL, qr: `/exports/${filename}` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate invite QR', error: error.message });
  }
};

exports.generatePaymentQR = async (req, res) => {
  try {
    const to =req.user._id;
    console.log(to)
    const { groupId } = req.params;
    const { from, amount} = req.query;

    if (!from || !amount || !to) {
      return res.status(400).json({ message: "Missing 'from' user ID or amount in query params." });
    }

    const payURL = `http://localhost:5000/api/settlements/qr-settlement/${groupId}?from=${from}&to=${to}&amount=${amount}`;

    const exportDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir);

    const filename = `pay-${groupId}-${from}.png`;
    const fullPath = path.join(exportDir, filename);
    await generateQRCode(payURL, fullPath);

    res.json({ url: payURL, qr: `/exports/${filename}` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate payment QR', error: error.message });
  }
};
