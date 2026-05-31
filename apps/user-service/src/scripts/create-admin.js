const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres_password',
  database: process.env.DB_DATABASE || 'municipality_db',
});

async function run() {
  console.log('\n==================================================');
  console.log('  Day 0 Activity: Seeding Sinnar Admin (Direct PG)');
  console.log('==================================================\n');

  try {
    await client.connect();
    console.log('[info] Connected to PostgreSQL database successfully.');

    // Check if the ADMIN role user already exists
    const email = 'admin@sinnar.in';
    const checkRes = await client.query('SELECT id FROM users WHERE email = $1', [email]);

    if (checkRes.rows.length > 0) {
      console.log(`[info] Admin user "${email}" already exists. Skipping.`);
    } else {
      // Generate a random UUID using Node's crypto library
      const adminId = crypto.randomUUID ? crypto.randomUUID() : 'a3e0f0d2-9c12-4c28-9844-31ea6780c10a';
      
      const insertQuery = `
        INSERT INTO users (
          id, email, password, name, role, phone, address, rating, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      `;

      await client.query(insertQuery, [
        adminId,
        email,
        'admin_password',
        'Sinnar Admin (Administrator)',
        'ADMIN',
        '9999911111',
        'Sinnar Municipal Head Office, Sinnar, Nashik, Maharashtra',
        5.0
      ]);

      console.log(`[success] Successfully seeded Admin user with email "${email}"!`);
    }
  } catch (error) {
    console.error('[error] Database seeding failed:', error);
  } finally {
    await client.end();
    console.log('[info] Connection closed.');
  }

  console.log('\n==================================================\n');
}

run();
