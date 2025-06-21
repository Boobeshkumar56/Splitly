const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

async function generateGroupSummaryPDF(summary, filename = 'summary.pdf', fullpath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(fullpath); 

    doc.pipe(stream);

    // Title
    doc.fontSize(20).text('Group Expense Summary', { align: 'center', underline: true });
    doc.moveDown();

    // Summary Section
    doc.fontSize(12).text(`Group: ${summary.groupName}`);
    doc.text(`Total Spent: ₹${summary.totalSpent}`);
    doc.text(`Top Spender: ${summary.topSpender.user} (₹${summary.topSpender.amount})`);
    doc.moveDown();

    // Category Breakdown
    doc.fontSize(14).text('Category-wise Breakdown:', { underline: true });
    const categories = summary.categoryBreakdown;
    Object.keys(categories).forEach((cat, i) => {
      doc.fontSize(12).text(`${i + 1}. ${cat}: ₹${categories[cat]}`);
    });
    doc.moveDown();

    // Contributions Table
    doc.fontSize(14).text('User Contributions:', { underline: true });
    summary.userContributions.forEach((u, i) => {
      doc.fontSize(12).text(`${i + 1}. ${u.user} - Paid: ₹${u.amountPaid}, Owes: ₹${u.amountOwed}`);
    });

    doc.end();

    stream.on('finish', () => resolve(fullpath)); 
    stream.on('error', reject);
  });
}

module.exports = generateGroupSummaryPDF;
