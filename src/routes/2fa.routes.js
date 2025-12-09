const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const ctrl = require("../controllers/2fa.controller");

router.post("/send-otp", auth, ctrl.sendOTP);
router.post("/enable", auth, ctrl.enable2FA);

module.exports = router;