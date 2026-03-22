
import dotenv from 'dotenv';
dotenv.config();

console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL);
console.log('ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD);
console.log('Password length:', process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.length : 0);
