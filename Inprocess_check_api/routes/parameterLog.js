// routes/parameterLog.js
const express = require("express");
const ctrl = require("../controllers/ParameterLogController");

const router = express.Router();
router.get("/parameter-log", ctrl.getAllLogs);
router.post("/parameter-log", ctrl.createLog);
router.post("/parameter-log/bulk", ctrl.createLogsBulk);
router.delete("/parameter-log", ctrl.deleteAllLogs);

// GET /api/parameter-log/query - Query logs with filters (NEW)
router.get("/parameter-log/query", ctrl.queryLogs);
router.post("/queryLogs", ctrl.queryLogsPost);

module.exports = router;
