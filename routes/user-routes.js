const express = require("express")
const userControllers = require("../controllers/user-controllers")
const { authCheck } = require("../middleware/auth-middleware");

const router = express.Router()

router.get("/users", authCheck, userControllers.listUser)
router.patch("/user/update-role", authCheck, userControllers.updateRole)
router.delete("user/:id", authCheck, userControllers.dateleUser)

module.exports = router