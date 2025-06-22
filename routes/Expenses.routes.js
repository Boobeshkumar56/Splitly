const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/Expenses.control');
const authMiddleware = require('../middlewares/auth.middleware');
const settlementController = require('../controllers/Settlements.control');
// POST /api/expenses/add
router.post('/add-expenses', authMiddleware, expenseController.addExpense);
router.post("/qr-settlement/:groupId",authMiddleware,settlementController.settleViaQR)


router.post('/', authMiddleware, settlementController.recordSettlement);
router.post('/optimal', authMiddleware, settlementController.optimalsettlement);
module.exports = router;
