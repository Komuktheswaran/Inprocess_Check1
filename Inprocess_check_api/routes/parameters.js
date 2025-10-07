// routes/parameters.js
const express = require("express");
const controller = require("../controllers/parameterController");

const router = express.Router();
router.get("/parameters", controller.getAllParameters);
router.get("/parameters/:id", controller.getParameterById);
router.post("/parameters", controller.createParameter);
router.put("/parameters/:id", controller.updateParameter);
router.delete("/parameters/:id", controller.deleteParameter);

module.exports = router;
