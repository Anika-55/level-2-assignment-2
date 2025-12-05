import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export const pool = new Pool({
    connectionString: process.env.CONNECTION_STR
});
