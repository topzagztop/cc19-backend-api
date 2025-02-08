const express = require("express");
const authControllers = require("../controllers/auth-controllers");
const {
  registerSchema,
  loginSchema,
  validateWithZod,
} = require("../middleware/validators");
const { authCheck } = require("../middleware/auth-middleware");

const router = express.Router();

router.post(
  "/register",
  validateWithZod(registerSchema),
  authControllers.register
);
router.post("/login", validateWithZod(loginSchema), authControllers.login);
router.get("/current-user", authCheck, authControllers.currentUser);

module.exports = router;
