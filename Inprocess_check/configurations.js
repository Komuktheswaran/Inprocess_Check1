// controllers/configurationsController.js
const database = require("../Inprocess_check_api/config/database");
const sql = require("mssql");

const configurations = {
  // GET /api/configurations
  getAllConfigurations: async (req, res) => {
    try {
      const pool = database.getPool();
      const request = pool.request();

      const query = `
                SELECT 
                    Line,
                    Shift,
                    ROW_NUMBER() OVER (ORDER BY Line, Shift) AS id
                FROM Configuration 
                ORDER BY Line, Shift
            `;

      const result = await request.query(query);

      res.json({
        success: true,
        data: result.recordset,
        count: result.recordset.length,
        message: `Retrieved ${result.recordset.length} configurations`,
      });
    } catch (error) {
      console.error("Error fetching configurations:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch configurations",
        error: error.message,
      });
    }
  },

  // POST /api/configurations
  createConfiguration: async (req, res) => {
    try {
      const { Line, Shift } = req.body;

      // Validation
      if (!Line || !Shift) {
        return res.status(400).json({
          success: false,
          message: "Line and Shift are required fields",
        });
      }

      const pool = database.getPool();
      const request = pool.request();

      // Check if combination already exists
      const checkQuery = `
                SELECT COUNT(*) as count 
                FROM Configuration 
                WHERE Line = @Line AND Shift = @Shift
            `;

      request.input("Line", sql.NVarChar, Line);
      request.input("Shift", sql.NVarChar, Shift);

      const checkResult = await request.query(checkQuery);

      if (checkResult.recordset[0].count > 0) {
        return res.status(409).json({
          success: false,
          message: `Configuration with Line '${Line}' and Shift '${Shift}' already exists`,
        });
      }

      // Insert new configuration
      const insertQuery = `
                INSERT INTO Configuration (Line, Shift) 
                VALUES (@Line, @Shift)
            `;

      await request.query(insertQuery);

      res.status(201).json({
        success: true,
        message: "Configuration created successfully",
        data: { Line, Shift },
      });
    } catch (error) {
      console.error("Error creating configuration:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create configuration",
        error: error.message,
      });
    }
  },

  // PUT /api/configurations/:id (Optional - if you add ID field)
  updateConfiguration: async (req, res) => {
    try {
      const { id } = req.params;
      const { Line, Shift, OldLine, OldShift } = req.body;

      // Validation
      if (!Line || !Shift) {
        return res.status(400).json({
          success: false,
          message: "Line and Shift are required fields",
        });
      }

      if (!OldLine || !OldShift) {
        return res.status(400).json({
          success: false,
          message: "OldLine and OldShift are required to identify the record",
        });
      }

      const pool = database.getPool();
      const request = pool.request();

      // Update configuration (since there's no ID field, use old values)
      const updateQuery = `
                UPDATE Configuration 
                SET Line = @NewLine, Shift = @NewShift
                WHERE Line = @OldLine AND Shift = @OldShift
            `;

      request.input("NewLine", sql.NVarChar, Line);
      request.input("NewShift", sql.NVarChar, Shift);
      request.input("OldLine", sql.NVarChar, OldLine);
      request.input("OldShift", sql.NVarChar, OldShift);

      const result = await request.query(updateQuery);

      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({
          success: false,
          message: "Configuration not found",
        });
      }

      res.json({
        success: true,
        message: "Configuration updated successfully",
        data: { Line, Shift },
      });
    } catch (error) {
      console.error("Error updating configuration:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update configuration",
        error: error.message,
      });
    }
  },

  // DELETE /api/configurations/:id (Optional - using Line and Shift as composite key)
  deleteConfiguration: async (req, res) => {
    try {
      const { Line, Shift } = req.query; // Pass as query params since no ID field

      if (!Line || !Shift) {
        return res.status(400).json({
          success: false,
          message: "Line and Shift query parameters are required",
        });
      }

      const pool = database.getPool();
      const request = pool.request();

      const deleteQuery = `
                DELETE FROM Configuration 
                WHERE Line = @Line AND Shift = @Shift
            `;

      request.input("Line", sql.NVarChar, Line);
      request.input("Shift", sql.NVarChar, Shift);

      const result = await request.query(deleteQuery);

      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({
          success: false,
          message: "Configuration not found",
        });
      }

      res.json({
        success: true,
        message: "Configuration deleted successfully",
        deletedCount: result.rowsAffected[0],
      });
    } catch (error) {
      console.error("Error deleting configuration:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete configuration",
        error: error.message,
      });
    }
  },

  // DELETE /api/configurations (Delete all - useful for testing)
  deleteAllConfigurations: async (req, res) => {
    try {
      const pool = database.getPool();
      const request = pool.request();

      const deleteQuery = `DELETE FROM Configuration`;
      const result = await request.query(deleteQuery);

      res.json({
        success: true,
        message: "All configurations deleted successfully",
        deletedCount: result.rowsAffected[0],
      });
    } catch (error) {
      console.error("Error deleting all configurations:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete configurations",
        error: error.message,
      });
    }
  },
};

module.exports = configurations;
