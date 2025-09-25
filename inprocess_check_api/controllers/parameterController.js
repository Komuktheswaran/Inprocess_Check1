// controllers/parameterController.js
const sql = require('mssql');
const database = require('../config/database');

class ParameterController {
    // GET /api/parameters
    async getAllParameters(req, res) {
        try {
            const pool = database.getPool();
            const request = new sql.Request(pool);
            const result = await request.query(
                'SELECT * FROM dbo.Parameter_Master ORDER BY Para_ID'
            );
            res.json({ success: true, data: result.recordset });
        } catch (error) {
            console.error('Error fetching parameters:', error);
            res.status(500).json({ success: false, message: 'Error fetching parameters', error: error.message });
        }
    }

    // GET /api/parameters/:id
    async getParameterById(req, res) {
        try {
            const { id } = req.params;
            const pool = database.getPool();
            const request = new sql.Request(pool);
            request.input('id', sql.Int, parseInt(id));
            const result = await request.query(
                'SELECT * FROM dbo.Parameter_Master WHERE Para_ID = @id'
            );
            if (result.recordset.length === 0) {
                return res.status(404).json({ success: false, message: 'Parameter not found' });
            }
            res.json({ success: true, data: result.recordset[0] });
        } catch (error) {
            console.error('Error fetching parameter:', error);
            res.status(500).json({ success: false, message: 'Error fetching parameter', error: error.message });
        }
    }

    // POST /api/parameters
    // Body: { Para_Name, Para_Type, Unit, Para_Min, Para_Max }
    async createParameter(req, res) {
        try {
            const { Para_Name, Para_Type, Unit, Para_Min, Para_Max } = req.body;

            if (!Para_Name || !Para_Type || !Unit) {
                return res.status(400).json({ success: false, message: 'Para_Name, Para_Type, and Unit are required' });
            }

            const pool = database.getPool();

            // Duplicate check by name (and optionally min/max if needed)
            const dup = await new sql.Request(pool)
                .input('name', sql.NVarChar(255), Para_Name)
                .query('SELECT TOP 1 Para_ID FROM dbo.Parameter_Master WHERE Para_Name = @name');

            if (dup.recordset.length > 0) {
                return res.status(409).json({ success: false, message: 'Parameter with same name already exists' });
            }

            const r = await new sql.Request(pool)
                .input('name', sql.NVarChar(255), Para_Name)
                .input('type', sql.NVarChar(50), Para_Type)
                .input('unit', sql.NVarChar(50), Unit)
                .input('min', sql.Numeric(15, 4), Para_Min ?? null)
                .input('max', sql.Numeric(15, 4), Para_Max ?? null)
                .query(`
          INSERT INTO dbo.Parameter_Master (Para_Name, Para_Type, Unit_Measured, Para_Min, Para_Max)
          VALUES (@name, @type, @unit, @min, @max);
          SELECT SCOPE_IDENTITY() AS id;
        `);

            res.status(201).json({
                success: true,
                message: 'Parameter created successfully',
                data: {
                    Para_ID: r.recordset[0].id,
                    Para_Name,
                    Para_Type,
                    Unit_Measured: Unit,
                    Para_Min,
                    Para_Max
                }
            });
        } catch (error) {
            console.error('Error creating parameter:', error);
            res.status(500).json({ success: false, message: 'Error creating parameter', error: error.message });
        }
    }

    // PUT /api/parameters/:id
    async updateParameter(req, res) {
        try {
            const { id } = req.params;
            const { Para_Name, Para_Type, Unit, Para_Min, Para_Max } = req.body;

            if (!Para_Name || !Para_Type || !Unit) {
                return res.status(400).json({ success: false, message: 'Para_Name, Para_Type, and Unit are required' });
            }

            const pool = database.getPool();

            const dup = await new sql.Request(pool)
                .input('id', sql.Int, parseInt(id))
                .input('name', sql.NVarChar(255), Para_Name)
                .query(`
          SELECT TOP 1 Para_ID FROM dbo.Parameter_Master
          WHERE Para_Name = @name AND Para_ID <> @id
        `);

            if (dup.recordset.length > 0) {
                return res.status(409).json({ success: false, message: 'Another parameter with same name exists' });
            }

            await new sql.Request(pool)
                .input('id', sql.Int, parseInt(id))
                .input('name', sql.NVarChar(255), Para_Name)
                .input('type', sql.NVarChar(50), Para_Type)
                .input('unit', sql.NVarChar(50), Unit)
                .input('min', sql.Numeric(15, 4), Para_Min ?? null)
                .input('max', sql.Numeric(15, 4), Para_Max ?? null)
                .query(`
          UPDATE dbo.Parameter_Master
          SET Para_Name = @name, Para_Type = @type, Unit_Measured = @unit,
              Para_Min = @min, Para_Max = @max
          WHERE Para_ID = @id
        `);

            res.json({
                success: true,
                message: 'Parameter updated successfully',
                data: { Para_ID: parseInt(id), Para_Name, Para_Type, Unit_Measured: Unit, Para_Min, Para_Max }
            });
        } catch (error) {
            console.error('Error updating parameter:', error);
            res.status(500).json({ success: false, message: 'Error updating parameter', error: error.message });
        }
    }

    // DELETE /api/parameters/:id
    async deleteParameter(req, res) {
        try {
            const { id } = req.params;
            const pool = database.getPool();
            await new sql.Request(pool)
                .input('id', sql.Int, parseInt(id))
                .query('DELETE FROM dbo.Parameter_Master WHERE Para_ID = @id');
            res.json({ success: true, message: 'Parameter deleted successfully' });
        } catch (error) {
            console.error('Error deleting parameter:', error);
            res.status(500).json({ success: false, message: 'Error deleting parameter', error: error.message });
        }
    }
}

module.exports = new ParameterController();
