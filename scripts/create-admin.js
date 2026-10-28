require('dotenv').config();
const bcrypt=require('bcryptjs');const db=require('../backend/db');
(async()=>{const [,,email,password]=process.argv;
if(!email||!password||password.length<12)throw Error('Usage: node scripts/create-admin.js EMAIL PASSWORD_AT_LEAST_12_CHARS');
await db.execute('INSERT INTO admins(email,password_hash) VALUES(?,?) ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash)',[email.toLowerCase(),await bcrypt.hash(password,12)]);
console.log('Admin created/updated:',email);await db.end();})().catch(e=>{console.error(e.message);process.exit(1)});
