const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT),
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectionTimeout: 30000,
        requestTimeout: 30000,
    },
};

class Database {
    constructor() {
        this.pool = null;
    }

    async connect() {
        try {
            this.pool = await sql.connect(config);
            console.log('Connected to MSSQL database');
            await this.createTables();
        } catch (error) {
            console.error('Database connection failed:', error);
            throw error;
        }
    }

    async createTables() {
        try {
            const request = new sql.Request(this.pool);

            // Create Parameter_Master table if not exists
            await request.query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Parameter_Master' AND xtype='U')
        CREATE TABLE Parameter_Master (
          Para_ID INT IDENTITY(1,1) PRIMARY KEY,
          Para_Name NVARCHAR(255) NOT NULL,
          Para_Type NVARCHAR(50) CHECK (Para_Type IN ('Quantitative', 'Qualitative')),
          Para_Min DECIMAL(10,2) NULL,
          Para_Max DECIMAL(10,2) NULL,
          created_at DATETIME DEFAULT GETDATE()
        )
      `);

            // Create Parameter_Log table if not exists
            await request.query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Parameter_Log' AND xtype='U')
        CREATE TABLE Parameter_Log (
          id INT IDENTITY(1,1) PRIMARY KEY,
          date_time NVARCHAR(50) NOT NULL,
          shift_name NVARCHAR(10),
          unit NVARCHAR(10),
          line_name NVARCHAR(10),
          model_name NVARCHAR(100),
          nominal_rating NVARCHAR(50),
          measure_name NVARCHAR(255),
          measure_value DECIMAL(10,2),
          uom NVARCHAR(20),
          min_value DECIMAL(10,2),
          max_value DECIMAL(10,2),
          created_at DATETIME DEFAULT GETDATE()
        )
      `);

            // Insert default parameters if table is empty
            await this.insertDefaultParameters();

        } catch (error) {
            console.error('Error creating tables:', error);
        }
    }

    async insertDefaultParameters() {
        try {
            const request = new sql.Request(this.pool);
            const checkResult = await request.query('SELECT COUNT(*) as count FROM Parameter_Master');

            if (checkResult.recordset[0].count === 0) {
                const parameters = [
                    { name: 'Insulation Resistance (IR)', type: 'Quantitative', min: 40, max: null },
                    { name: 'Visual Inspection', type: 'Qualitative', min: null, max: null },
                    { name: 'Voltage Test', type: 'Quantitative', min: 220, max: 240 },
                ];

                for (const param of parameters) {
                    const insertRequest = new sql.Request(this.pool);
                    await insertRequest
                        .input('name', sql.NVarChar, param.name)
                        .input('type', sql.NVarChar, param.type)
                        .input('min', sql.Decimal(10, 2), param.min)
                        .input('max', sql.Decimal(10, 2), param.max)
                        .query('INSERT INTO Parameter_Master (Para_Name, Para_Type, Para_Min, Para_Max) VALUES (@name, @type, @min, @max)');
                }
            }
        } catch (error) {
            console.error('Error inserting default parameters:', error);
        }
    }

    getPool() {
        return this.pool;
    }
}

module.exports = new Database();
