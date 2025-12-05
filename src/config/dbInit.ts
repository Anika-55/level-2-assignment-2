import { pool } from "./db";

export const initDB = async () => {
  try {
    // --- USERS TABLE ---
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL
      );
    `);

    // Add missing columns if table already existed
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS password VARCHAR(255) NOT NULL DEFAULT 'temp';
    `);

    await pool.query(`
      ALTER TABLE users
      ALTER COLUMN password DROP DEFAULT;
    `);

    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
    `);

    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'customer';
    `);

    // --- CARS TABLE ---
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cars (
        id SERIAL PRIMARY KEY
      );
    `);

    await pool.query(`
      ALTER TABLE cars
      ADD COLUMN IF NOT EXISTS brand VARCHAR(50);
    `);
    await pool.query(`
      ALTER TABLE cars
      ADD COLUMN IF NOT EXISTS model VARCHAR(50);
    `);
    await pool.query(`
      ALTER TABLE cars
      ADD COLUMN IF NOT EXISTS year INT;
    `);
    await pool.query(`
      ALTER TABLE cars
      ADD COLUMN IF NOT EXISTS price_per_day FLOAT;
    `);
    await pool.query(`
      ALTER TABLE cars
      ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT true;
    `);

    // --- RENTALS TABLE ---
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rentals (
        id SERIAL PRIMARY KEY
      );
    `);

    await pool.query(`
      ALTER TABLE rentals
      ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id) ON DELETE CASCADE;
    `);
    await pool.query(`
      ALTER TABLE rentals
      ADD COLUMN IF NOT EXISTS car_id INT REFERENCES cars(id) ON DELETE CASCADE;
    `);
    await pool.query(`
      ALTER TABLE rentals
      ADD COLUMN IF NOT EXISTS start_date DATE;
    `);
    await pool.query(`
      ALTER TABLE rentals
      ADD COLUMN IF NOT EXISTS end_date DATE;
    `);
    await pool.query(`
      ALTER TABLE rentals
      ADD COLUMN IF NOT EXISTS total_cost FLOAT;
    `);

    // Add vehicles
    await pool.query(`
  CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY
  );
`);

await pool.query(`
  ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS vehicle_name VARCHAR(100);
`);
await pool.query(`
  ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS type VARCHAR(50);
`);
await pool.query(`
  ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS registration_number VARCHAR(50) UNIQUE;
`);
await pool.query(`
  ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS daily_rent_price FLOAT;
`);
await pool.query(`
  ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS availability_status VARCHAR(20) DEFAULT 'available';
`);


    console.log("📌 Database initialized and all tables are up-to-date!");

  } catch (error) {
    console.error("❌ Error initializing database:", error);
  }
};
