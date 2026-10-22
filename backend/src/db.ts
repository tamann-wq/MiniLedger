import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.query(`
  SELECT
    current_database() AS database_name,
    current_user AS connected_user,
    inet_server_addr() AS server_address,
    inet_server_port() AS server_port
`)
.then((result) => {
  console.log("MiniLedger DB connection:", result.rows[0]);
})
.catch((error) => {
  console.error("MiniLedger DB connection failed:", error.message);
});