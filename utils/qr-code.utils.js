// utils/qrcode.util.js
const QRCode = require('qrcode');
const fs = require('fs');

async function generateQRCode(text, filePath) {
  return new Promise((resolve, reject) => {
    QRCode.toFile(filePath, text, {
      color: { dark: '#000000', light: '#FFFFFF' }
    }, (err) => {
      if (err) return reject(err);
      resolve(filePath);
    });
  });
}

module.exports = generateQRCode;
