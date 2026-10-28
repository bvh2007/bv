const mysql = require('mysql2/promise');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required; configure MySQL first');
const pool = mysql.createPool({uri:process.env.DATABASE_URL,waitForConnections:true,connectionLimit:8,ssl:process.env.DB_SSL==='true'?{rejectUnauthorized:true}:undefined});
module.exports=pool;
