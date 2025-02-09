import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  ssl: {
    rejectUnauthorized: false
  }
});

async function seedUsers() {
  const connection = await pool.getConnection();
  try {
    // MySQL에서는 UUID 함수가 기본으로 제공됨
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id CHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password TEXT NOT NULL
      )
    `);

    // 사용자 데이터 삽입
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await connection.query(
        'INSERT IGNORE INTO users (id, name, email, password) VALUES (?, ?, ?, ?)',
        [user.id, user.name, user.email, hashedPassword]
      );
    }
  } finally {
    connection.release();
  }
}

async function seedInvoices() {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id CHAR(36) PRIMARY KEY,
        customer_id CHAR(36) NOT NULL,
        amount INT NOT NULL,
        status VARCHAR(255) NOT NULL,
        date DATE NOT NULL
      )
    `);

    for (const invoice of invoices) {
      await connection.query(
        'INSERT IGNORE INTO invoices (id, customer_id, amount, status, date) VALUES (?, ?, ?, ?, ?)',
        [invoice.id, invoice.customer_id, invoice.amount, invoice.status, invoice.date]
      );
    }
  } finally {
    connection.release();
  }
}

async function seedCustomers() {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id CHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        image_url VARCHAR(255) NOT NULL
      )
    `);

    for (const customer of customers) {
      await connection.query(
        'INSERT IGNORE INTO customers (id, name, email, image_url) VALUES (?, ?, ?, ?)',
        [customer.id, customer.name, customer.email, customer.image_url]
      );
    }
  } finally {
    connection.release();
  }
}

async function seedRevenue() {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS revenue (
        month CHAR(4) NOT NULL UNIQUE,
        revenue INT NOT NULL
      )
    `);

    for (const rev of revenue) {
      await connection.query(
        'INSERT IGNORE INTO revenue (month, revenue) VALUES (?, ?)',
        [rev.month, rev.revenue]
      );
    }
  } finally {
    connection.release();
  }
}

export async function GET() {
  try {
    const connection = await pool.getConnection();
    const result = await Promise.all([
      seedUsers(),
      seedCustomers(),
      seedInvoices(),
      seedRevenue(),
    ]);

    return Response.json({ message: 'Database seeded successfully' });
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
