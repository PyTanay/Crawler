const sql = require("mssql");

const config = {
  server: "localhost",
  port: 1433, // or use 127.0.0.1 or your IP
  database: "Dahej_data", // replace with your actual database name
  user: "8979", // replace with your SQL user name
  password: "tsg123", // replace with your SQL user password
  options: {
    encrypt: true, // Set to true if you are using encryption
    trustServerCertificate: true, // Disable certificate validation if needed
  },
};

async function insertJsonToSql(jsonData, tableName, pool) {
  try {
    // Connect to SQL Server
    // const pool = await sql.connect(config);
    console.log("database connected.");

    // Loop through each record in the JSON data
    for (const row of jsonData) {
      // Get the keys from the first row of JSON data (this assumes all rows have the same structure)
      const columns = Object.keys(row);
      const values = Object.values(row);

      // Dynamically build the column names and parameter placeholders
      const columnNames = columns.map((col) => `[${col}]`).join(", ");
      const paramPlaceholders = columns.map((col) => `@${col}`).join(", ");

      // Dynamically create the SQL query
      const query = `INSERT INTO ${tableName} (${columnNames}) VALUES (${paramPlaceholders})`;

      // Prepare the SQL request
      const request = pool.request();

      // Dynamically bind each value to the SQL query
      columns.forEach((col, index) => {
        const value = values[index];
        request.input(col, getSqlType(value), value); // Dynamically determine SQL type
      });

      // Execute the query
      await request.query(query);
    }

    // console.log("Data inserted successfully");
  } catch (err) {
    console.error("Error inserting data:", err);
    throw new Error("Data exists");
  } finally {
    // await sql.close();
  }
}
function getSqlType(value) {
  if (typeof value === "string") return sql.VarChar;
  if (typeof value === "number") return sql.Float; // or sql.Int for integers
  if (typeof value === "boolean") return sql.Bit;
  if (value instanceof Date) return sql.DateTime;
  return sql.VarChar; // Default to string
}
module.exports = insertJsonToSql;
