// controllers/ParameterLogController.js
const sql = require("mssql");
const database = require("../config/database");

// Helper to resolve parameter id by name when not provided
async function resolveParaId(reqOrTx, measureName) {
  const r = await new sql.Request(reqOrTx)
    .input("MeasureName", sql.NVarChar(200), measureName)
    .query(
      "SELECT Para_ID FROM dbo.Parameter_Master WITH (NOLOCK) WHERE Para_Name = @MeasureName"
    );
  return r.recordset?.[0]?.Para_ID ?? null;
}

class ParameterLogController {
  async queryLogsPost(req, res) {
    try {
      const { date, shift, line } = req.body; // Expect JSON body

      // Input validation (similar to your existing)
      if (!date || !shift || !line) {
        return res.status(400).json({
          success: false,
          message: "Missing required filters: date, shift, line",
        });
      }

      const pool = database.getPool();
      const request = new sql.Request(pool);

      // Base query (matches your existing structure: join Parameter_Log with Parameter_Master)
      let query = `
        SELECT 
          pl.Log_ID,
          pl.Log_DateTime as LogDateTime,
          pl.Shift_Name as ShiftName,
          pl.Line_Name as LineName,
          pl.Criteria as Criteria,
          pl.Para_ID,
          pm.Para_Name as ParaName,
          pm.Unit_Measured as UnitMeasured,
          pl.Value_Recorded as ValueRecorded,
          pl.Remarks,
          pl.Inspector_Name
        FROM dbo.Parameter_Log pl WITH (NOLOCK)
        LEFT JOIN dbo.Parameter_Master pm WITH (NOLOCK) ON pm.Para_ID = pl.Para_ID
        WHERE 1=1
      `;

      const conditions = [];

      // Specific date filtering (full day for selected date, like your onDate logic)
      const startOfDay = new Date(date + "T00:00:00"); // Assumes IST; adjust if UTC stored
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);
      conditions.push(
        "pl.Log_DateTime >= @startOfDay AND pl.Log_DateTime < @endOfDay"
      );
      request.input("startOfDay", sql.DateTime2, startOfDay.toISOString());
      request.input("endOfDay", sql.DateTime2, endOfDay.toISOString());

      // Shift filtering
      if (shift) {
        conditions.push("pl.Shift_Name = @shift");
        request.input("shift", sql.NVarChar(50), shift);
      }

      // Line filtering
      if (line) {
        conditions.push("pl.Line_Name = @line");
        request.input("line", sql.NVarChar(50), line);
      }

      // Add all conditions to query
      if (conditions.length > 0) {
        query += " AND " + conditions.join(" AND ");
      }

      // Order by Para_ID and Log_ID DESC to get latest per parameter first (frontend handles grouping)
      query += " ORDER BY pl.Para_ID, pl.Log_ID DESC";

      console.log("Executing POST queryLogs query:", query);

      const result = await request.query(query);

      res.json({
        success: true,
        data: result.recordset, // Array of logs with joined details (e.g., Para_ID, ValueRecorded, Remarks)
        count: result.recordset.length,
        query: {
          filters: { date, shift, line },
          resultCount: result.recordset.length,
        },
        message: `Retrieved ${result.recordset.length} log entries for ${date}, ${shift}, ${line}`,
      });
    } catch (error) {
      console.error("Error querying parameter logs (POST):", error);
      res.status(500).json({
        success: false,
        message: "Failed to query parameter logs",
        error: error.message,
      });
    }
  }
  async queryLogs(req, res) {
    try {
      const { mode, from, to, shift, line, paraid, onDate } = req.query;

      const pool = database.getPool();
      const request = new sql.Request(pool);
      console.log("Querying parameter logs with:", req.query);

      // Base query matching your existing structure
      let query = `
                SELECT *,
                    pl.Log_ID,
                    pl.Log_DateTime as LogDateTime,
                    pl.Shift_Name as ShiftName,
                    pl.Line_Name as LineName,
                    pl.Criteria as Criteria,
                    pl.Para_ID,
                    pm.Para_Name as ParaName,
                    pm.Unit_Measured as UnitMeasured,
                    pl.Value_Recorded as ValueRecorded,
                    pl.Remarks,
          pl.Inspector_Name
                FROM dbo.Parameter_Log pl WITH (NOLOCK)
                LEFT JOIN dbo.Parameter_Master pm WITH (NOLOCK) ON pm.Para_ID = pl.Para_ID
                WHERE 1=1
            `;

      const conditions = [];

      // Date range filtering
      if (from) {
        conditions.push("pl.Log_DateTime >= @from");
        request.input("from", sql.DateTime2, from);
      }

      if (to) {
        conditions.push("pl.Log_DateTime <= @to");
        request.input("to", sql.DateTime2, to);
      }

      // Specific date filtering (for shift-wise with date)
      if (onDate) {
        const startOfDay = new Date(onDate);
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        conditions.push(
          "pl.Log_DateTime >= @startOfDay AND pl.Log_DateTime < @endOfDay"
        );
        request.input("startOfDay", sql.DateTime2, startOfDay.toISOString());
        request.input("endOfDay", sql.DateTime2, endOfDay.toISOString());
      }

      // Shift filtering
      if (shift) {
        conditions.push("pl.Shift_Name = @shift");
        request.input("shift", sql.NVarChar, shift);
      }

      // Line filtering
      if (line) {
        conditions.push("pl.Line_Name = @line");
        request.input("line", sql.NVarChar, line);
      }

      // Parameter filtering
      if (paraid) {
        conditions.push("pl.Para_ID = @paraid");
        request.input("paraid", sql.Numeric(18, 0), parseInt(paraid));
      }

      // Add all conditions to query
      if (conditions.length > 0) {
        query += " AND " + conditions.join(" AND ");
      }

      // Order by most recent first
      query += " ORDER BY pl.Log_DateTime DESC";

      const result = await request.query(query);

      console.log("Parameter logs query result count:", result);
      res.json({
        success: true,
        data: result.recordset,
        count: result.recordset.length,
        query: {
          mode,
          filters: { from, to, shift, line, paraid, onDate },
          resultCount: result.recordset.length,
        },
        message: `Retrieved ${result.recordset.length} log entries`,
      });
    } catch (error) {
      console.error("Error querying parameter logs:", error);
      res.status(500).json({
        success: false,
        message: "Failed to query parameter logs",
        error: error.message,
      });
    }
  }
  // GET /api/parameter-log?top=200
  async getAllLogs(req, res) {
    try {
      const top = Math.min(Number(req.query.top) || 200, 1000);
      const pool = database.getPool();
      const request = new sql.Request(pool);
      const result = await request.query(`
        SELECT TOP (${top})
          pl.Log_ID,
          pl.Log_DateTime,
          pl.Line_Name,
          pl.Shift_Name,
          pl.Criteria,
          pl.Para_ID,
          pm.Para_Name,
          pm.Unit_Measured,
          pl.Value_Recorded,
          pl.Remarks,
          pl.Inspector_Name
        FROM dbo.Parameter_Log pl WITH (NOLOCK)
        LEFT JOIN dbo.Parameter_Master pm WITH (NOLOCK) ON pm.Para_ID = pl.Para_ID
        ORDER BY pl.Log_DateTime DESC, pl.Log_ID DESC;
      `);
      res.json({ success: true, data: result.recordset });
    } catch (error) {
      console.error("Error fetching logs:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching logs",
        error: error.message,
      });
    }
  }

  // POST /api/parameter-log
  // Body: { datetime, linename, shiftname, Criteria?, paraid?, measurename?, measurevalue, remark, inspector? }
  async createLog(req, res) {
    try {
      const {
        datetime,
        linename,
        shiftname,
        Criteria,
        paraid,
        measurename,
        measurevalue,
        remark,
        inspector, // NEW: Destructure inspector
      } = req.body;
      console.log(req.body); // Includes inspector in log
      if (!datetime || !linename || !shiftname) {
        return res.status(400).json({
          success: false,
          message: "datetime, linename, shiftname are required",
        });
      }
      let pid = paraid;
      const pool = database.getPool();

      if (!pid && measurename) {
        // Resolve pid from measurename if needed (assuming you have a function for this)
        pid = await resolveParaId(pool, measurename);
      }
      if (!pid)
        return res.status(400).json({
          success: false,
          message: "Unknown parameter (provide paraid or measurename)",
        });

      // Check if record exists
      const existing = await new sql.Request(pool)
        .input("LogDateTime", sql.DateTime2, datetime)
        .input("LineName", sql.NVarChar(64), linename)
        .input("ShiftName", sql.NVarChar(10), shiftname)
        .input("ParaID", sql.Numeric(18, 0), pid).query(`
            SELECT Log_ID FROM dbo.Parameter_Log
            WHERE Log_DateTime = @LogDateTime
            AND Line_Name = @LineName
            AND Shift_Name = @ShiftName
            AND Para_ID = @ParaID
        `);

      if (existing.recordset.length > 0) {
        // Update existing record
        await new sql.Request(pool)
          .input("LogDateTime", sql.DateTime2, datetime)
          .input("LineName", sql.NVarChar(64), linename)
          .input("ShiftName", sql.NVarChar(10), shiftname)
          .input("ParaID", sql.Numeric(18, 0), pid)
          .input("Criteria", sql.NVarChar(128), Criteria || null)
          .input("Value_Recorded", sql.NVarChar(10), String(measurevalue))
          .input("Remarks", sql.NVarChar(255), remark || null)
          .input("InspectorName", sql.NVarChar(128), inspector || null).query(`
              UPDATE dbo.Parameter_Log
              SET Criteria = @Criteria,
                  Value_Recorded = @Value_Recorded,
                  Remarks = @Remarks,
                  Inspector_Name = @InspectorName  
              WHERE Log_DateTime = @LogDateTime
              AND Line_Name = @LineName
              AND Shift_Name = @ShiftName
              AND Para_ID = @ParaID
          `);
        res.status(200).json({ success: true, message: "Log updated" });
      } else {
        // Insert new record
        await new sql.Request(pool)
          .input("LogDateTime", sql.DateTime2, datetime)
          .input("LineName", sql.NVarChar(64), linename)
          .input("ShiftName", sql.NVarChar(10), shiftname)
          .input("Criteria", sql.NVarChar(128), Criteria || null)
          .input("ParaID", sql.Numeric(18, 0), pid)
          .input("Value_Recorded", sql.NVarChar(10), String(measurevalue))
          .input("Remarks", sql.NVarChar(255), remark || null)
          .input("InspectorName", sql.NVarChar(128), inspector || null).query(`
              INSERT INTO dbo.Parameter_Log
                  (Log_DateTime, Line_Name, Shift_Name, Criteria,
                   Para_ID, Value_Recorded, Remarks, Inspector_Name)  
              VALUES
                  (@LogDateTime, @LineName, @ShiftName, @Criteria,
                   @ParaID, @Value_Recorded, @Remarks, @InspectorName); 
          `);
        res.status(201).json({ success: true, message: "Log created" });
      }
    } catch (error) {
      console.error("Error creating log:", error);
      res.status(500).json({
        success: false,
        message: "Error creating log",
        error: error.message,
      });
    }
  }

  // POST /api/parameter-log/bulk
  // Body: { items: [ { datetime, linename, shiftname, Criteria?, paraid?, measurename?, measurevalue, remark, inspector? }, ... ] }
  async createLogsBulk(req, res) {
    console.log("bulk", req.body);
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!items.length)
      return res
        .status(400)
        .json({ success: false, message: "No items to insert" });

    const pool = database.getPool();
    const tx = new sql.Transaction(pool);

    try {
      await tx.begin();

      for (const it of items) {
        const {
          datetime,
          linename,
          shiftname,
          Criteria,
          paraid,
          measurename,
          measurevalue,
          remark,
          inspector,
        } = it;

        if (!datetime || !linename || !shiftname) {
          throw new Error(
            "Validation failed: missing datetime/linename/shiftname"
          );
        }

        let pid = paraid ?? null;
        if (!pid && measurename) {
          pid = await resolveParaId(tx, measurename);
        }
        if (!pid) throw new Error("Validation failed: unknown parameter");

        // Check if record exists
        const existing = await new sql.Request(tx)
          .input("LogDateTime", sql.DateTime2, datetime)
          .input("LineName", sql.NVarChar(64), linename)
          .input("ShiftName", sql.NVarChar(10), shiftname)
          .input("ParaID", sql.Numeric(18, 0), pid).query(`
                SELECT Log_ID FROM dbo.Parameter_Log
                WHERE Log_DateTime = @LogDateTime
                AND Line_Name = @LineName
                AND Shift_Name = @ShiftName
                AND Para_ID = @ParaID
            `);

        if (existing.recordset.length > 0) {
          // Update existing record
          await new sql.Request(tx)
            .input("LogDateTime", sql.DateTime2, datetime)
            .input("LineName", sql.NVarChar(64), linename)
            .input("ShiftName", sql.NVarChar(10), shiftname)
            .input("ParaID", sql.Numeric(18, 0), pid)
            .input("Criteria", sql.NVarChar(128), Criteria || null)
            .input("Value_Recorded", sql.NVarChar(10), String(measurevalue))
            .input("Remarks", sql.NVarChar(255), remark || null)
            .input("InspectorName", sql.NVarChar(128), inspector || null)
            .query(`
                    UPDATE dbo.Parameter_Log
                    SET Criteria = @Criteria,
                        Value_Recorded = @Value_Recorded,
                        Remarks = @Remarks,
                        Inspector_Name = @InspectorName  
                    WHERE Log_DateTime = @LogDateTime
                    AND Line_Name = @LineName
                    AND Shift_Name = @ShiftName
                    AND Para_ID = @ParaID
                `);
        } else {
          // Insert new record
          await new sql.Request(tx)
            .input("LogDateTime", sql.DateTime2, datetime)
            .input("LineName", sql.NVarChar(64), linename)
            .input("ShiftName", sql.NVarChar(10), shiftname)
            .input("Criteria", sql.NVarChar(128), Criteria || null)
            .input("ParaID", sql.Numeric(18, 0), pid)
            .input("Value_Recorded", sql.NVarChar(10), String(measurevalue))
            .input("Remarks", sql.NVarChar(255), remark || null)
            .input("InspectorName", sql.NVarChar(128), inspector || null) // NEW: Bind inspector
            .query(`
                    INSERT INTO dbo.Parameter_Log
                        (Log_DateTime, Line_Name, Shift_Name, Criteria,
                         Para_ID, Value_Recorded, Remarks, Inspector_Name)  
                    VALUES
                        (@LogDateTime, @LineName, @ShiftName, @Criteria,
                         @ParaID, @Value_Recorded, @Remarks, @InspectorName);  
                `);
        }
      }

      await tx.commit();
      res.status(201).json({
        success: true,
        message: "Bulk logs created/updated",
        inserted: items.length,
      });
    } catch (error) {
      try {
        await tx.rollback();
      } catch {}
      console.error("Bulk insert error:", error);
      res.status(500).json({
        success: false,
        message: "Bulk insert failed",
        error: error.message,
      });
    }
  }

  // DELETE /api/parameter-log
  async deleteAllLogs(_req, res) {
    try {
      const pool = database.getPool();
      await new sql.Request(pool).query("DELETE FROM dbo.Parameter_Log");
      res.json({ success: true, message: "All logs deleted" });
    } catch (error) {
      console.error("Error deleting logs:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting logs",
        error: error.message,
      });
    }
  }
}

module.exports = new ParameterLogController();
