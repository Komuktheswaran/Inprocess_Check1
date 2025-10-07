// controllers/parameterController.js
const sql = require("mssql");
const database = require("../config/database");

class ParameterController {
  // GET /api/parameters
  // GET /api/parameters
  async getAllParameters(req, res) {
    try {
      const pool = database.getPool();
      const request = new sql.Request(pool);
      const result = await request.query(
        "SELECT * FROM dbo.Parameter_Master ORDER BY Para_ID"
      );
      // Automatically includes Criteria via SELECT *
      res.json({ success: true, data: result.recordset });
    } catch (error) {
      console.error("Error fetching parameters:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching parameters",
        error: error.message,
      });
    }
  }

  // GET /api/parameters/:id
  async getParameterById(req, res) {
    try {
      const { id } = req.params;
      const pool = database.getPool();
      const request = new sql.Request(pool);
      request.input("id", sql.Int, parseInt(id));
      const result = await request.query(
        "SELECT * FROM dbo.Parameter_Master WHERE Para_ID = @id"
      );
      // Automatically includes Criteria via SELECT *
      if (result.recordset.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Parameter not found" });
      }
      res.json({ success: true, data: result.recordset[0] });
    } catch (error) {
      console.error("Error fetching parameter:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching parameter",
        error: error.message,
      });
    }
  }

  // POST /api/parameters
  // Body: { Para_Name, Para_Type, Unit_Measured, Criteria?, Para_Min?, Para_Max? }
  async createParameter(req, res) {
    try {
      const {
        Para_Name,
        Para_Type,
        Unit_Measured: Unit,
        Criteria,
        Para_Min,
        Para_Max,
      } = req.body;
      console.log("Creating parameter:", req.body); // Includes Criteria in log

      if (!Para_Name || !Para_Type || !Unit) {
        return res.status(400).json({
          success: false,
          message: "Para_Name, Para_Type, and Unit_Measured are required",
        });
      }

      // Validate Criteria for Qualitative
      if (Para_Type === "Qualitative" && (!Criteria || !Criteria.trim())) {
        return res.status(400).json({
          success: false,
          message: "Criteria is required for Qualitative parameters",
        });
      }

      const pool = database.getPool();

      // Duplicate check by name (and optionally min/max if needed)
      const dup = await new sql.Request(pool)
        .input("name", sql.NVarChar(255), Para_Name)
        .query(
          "SELECT TOP 1 Para_ID FROM dbo.Parameter_Master WHERE Para_Name = @name"
        );

      if (dup.recordset.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Parameter with same name already exists",
        });
      }

      // Trim and nullify Criteria if empty
      const trimmedCriteria = Criteria ? Criteria.trim() : null;

      // NEW: Generate timestamp for create
      const now = new Date();

      const r = await new sql.Request(pool)
        .input("name", sql.NVarChar(255), Para_Name)
        .input("type", sql.NVarChar(50), Para_Type)
        .input("unit", sql.NVarChar(50), Unit)
        .input("criteria", sql.NVarChar(sql.MAX), trimmedCriteria)
        .input("min", sql.Numeric(15, 4), Para_Min ?? null)
        .input("max", sql.Numeric(15, 4), Para_Max ?? null)
        .input("createdTime", sql.DateTime2, now) // NEW: Bind timestamp
        .query(`
        INSERT INTO dbo.Parameter_Master (Para_Name, Para_Type, Unit_Measured, Criteria, Para_Min, Para_Max, Created_Time)  -- NEW: Add Created_Time column
        VALUES (@name, @type, @unit, @criteria, @min, @max, @createdTime);  -- NEW: Add @createdTime value
        SELECT SCOPE_IDENTITY() AS id;
      `);

      res.status(201).json({
        success: true,
        message: "Parameter created successfully",
        data: {
          Para_ID: r.recordset[0].id,
          Para_Name,
          Para_Type,
          Unit_Measured: Unit,
          Criteria: trimmedCriteria,
          Para_Min,
          Para_Max,
          Created_Time: now.toISOString(), // NEW: Include timestamp in response (ISO format)
        },
      });
    } catch (error) {
      console.error("Error creating parameter:", error);
      res.status(500).json({
        success: false,
        message: "Error creating parameter",
        error: error.message,
      });
    }
  }

  // PUT /api/parameters/:id
  // Body: { Para_Name, Para_Type, Unit_Measured, Criteria?, Para_Min?, Para_Max? }
  async updateParameter(req, res) {
    try {
      const { id } = req.params;
      const {
        Para_Name,
        Para_Type,
        Unit_Measured: Unit,
        Criteria,
        Para_Min,
        Para_Max,
      } = req.body;
      console.log("Updating parameter:", req.body); // Includes Criteria in log

      if (!Para_Name || !Para_Type || !Unit) {
        return res.status(400).json({
          success: false,
          message: "Para_Name, Para_Type, and Unit_Measured are required",
        });
      }

      // Validate Criteria for Qualitative
      if (Para_Type === "Qualitative" && (!Criteria || !Criteria.trim())) {
        return res.status(400).json({
          success: false,
          message: "Criteria is required for Qualitative parameters",
        });
      }

      const pool = database.getPool();

      const dup = await new sql.Request(pool)
        .input("id", sql.Int, parseInt(id))
        .input("name", sql.NVarChar(255), Para_Name).query(`
        SELECT TOP 1 Para_ID FROM dbo.Parameter_Master
        WHERE Para_Name = @name AND Para_ID <> @id
      `);

      if (dup.recordset.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Another parameter with same name exists",
        });
      }

      // Trim and nullify Criteria if empty
      const trimmedCriteria = Criteria ? Criteria.trim() : null;

      // NEW: Generate timestamp for update
      const now = new Date();

      await new sql.Request(pool)
        .input("id", sql.Int, parseInt(id))
        .input("name", sql.NVarChar(255), Para_Name)
        .input("type", sql.NVarChar(50), Para_Type)
        .input("unit", sql.NVarChar(50), Unit)
        .input("criteria", sql.NVarChar(sql.MAX), trimmedCriteria)
        .input("min", sql.Numeric(15, 4), Para_Min ?? null)
        .input("max", sql.Numeric(15, 4), Para_Max ?? null)
        .input("createdTime", sql.DateTime2, now) // NEW: Bind timestamp
        .query(`
        UPDATE dbo.Parameter_Master
        SET Para_Name = @name, Para_Type = @type, Unit_Measured = @unit,
            Criteria = @criteria,
            Para_Min = @min, Para_Max = @max,
            Created_Time = @createdTime  -- NEW: Update Created_Time
        WHERE Para_ID = @id
      `);

      res.json({
        success: true,
        message: "Parameter updated successfully",
        data: {
          Para_ID: parseInt(id),
          Para_Name,
          Para_Type,
          Unit_Measured: Unit,
          Criteria: trimmedCriteria,
          Para_Min,
          Para_Max,
          Created_Time: now.toISOString(), // NEW: Include timestamp in response (ISO format)
        },
      });
    } catch (error) {
      console.error("Error updating parameter:", error);
      res.status(500).json({
        success: false,
        message: "Error updating parameter",
        error: error.message,
      });
    }
  }

  // DELETE /api/parameters/:id
  async deleteParameter(req, res) {
    try {
      const { id } = req.params;
      const pool = database.getPool();
      await new sql.Request(pool)
        .input("id", sql.Int, parseInt(id))
        .query("DELETE FROM dbo.Parameter_Master WHERE Para_ID = @id");
      res.json({ success: true, message: "Parameter deleted successfully" });
    } catch (error) {
      console.error("Error deleting parameter:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting parameter",
        error: error.message,
      });
    }
  }
}

module.exports = new ParameterController();
