// routes/configurations.js
const express = require("express");
const router = express.Router();
const configurationsController = require("../controllers/configurations");

// GET /api/configurations - Get all configurations
router.get("/configurations", configurationsController.getAllConfigurations);

// POST /api/configurations - Create new configuration
router.post("/configurations", configurationsController.createConfiguration);

// PUT /api/configurations/:id - Update configuration (if you add ID field later)
router.put("/configurations/:id", configurationsController.updateConfiguration);

// DELETE /api/configurations/:id - Delete configuration (if you add ID field later)
router.delete(
  "/configurations/:id",
  configurationsController.deleteConfiguration
);

// DELETE /api/configurations - Delete all configurations
router.delete(
  "/configurations",
  configurationsController.deleteAllConfigurations
);

module.exports = router;
