const fs = require('fs');
const initSqlJs = require('sql.js');
const path = require('path');

let db;
let dbPath;

async function initDB(userDataPath) {
  dbPath = path.join(userDataPath, 'zeropos.sqlite');
  // Load sql.js
  const SQL = await initSqlJs();
  
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
    // Initialize schema
    db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        sort_order INTEGER
      );
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        category_id INTEGER,
        price REAL,
        active INTEGER DEFAULT 1
      );
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date_time TEXT,
        subtotal REAL,
        discount_type TEXT,
        discount_value REAL,
        discount_amount REAL,
        total REAL,
        payment_method TEXT,
        cash_received REAL,
        change_given REAL,
        note TEXT
      );
      CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER,
        item_name TEXT,
        price REAL,
        qty INTEGER
      );
    `);
    
    // Default data
    db.run("INSERT INTO settings (key, value) VALUES ('pin', '0000')");
    db.run("INSERT INTO settings (key, value) VALUES ('restaurant_name', 'ZeroPOS')");
    db.run("INSERT INTO settings (key, value) VALUES ('tagline', 'The ultimate offline POS')");
    db.run("INSERT INTO settings (key, value) VALUES ('address', 'Colombo, Sri Lanka')");
    db.run("INSERT INTO settings (key, value) VALUES ('phone', '+94 77 123 4567')");
    db.run("INSERT INTO settings (key, value) VALUES ('currency_symbol', 'Rs. ')");
    
    // Add some default categories
    db.run("INSERT INTO categories (name, sort_order) VALUES ('Mains', 1)");
    db.run("INSERT INTO categories (name, sort_order) VALUES ('Beverages', 2)");
    
    saveDB();
  }
}

function saveDB() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function query(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  } catch (err) {
    console.error("DB Query Error:", err, sql, params);
    throw err;
  }
}

function run(sql, params = []) {
  try {
    db.run(sql, params);
    saveDB();
    return { success: true };
  } catch (err) {
    console.error("DB Run Error:", err, sql, params);
    throw err;
  }
}

function insert(sql, params = []) {
  try {
    db.run(sql, params);
    saveDB();
    const res = query("SELECT last_insert_rowid() as id");
    return res[0].id;
  } catch (err) {
    console.error("DB Insert Error:", err, sql, params);
    throw err;
  }
}

module.exports = {
  initDB,
  query,
  run,
  insert
};
