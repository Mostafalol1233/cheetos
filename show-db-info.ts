
// Use process.env directly (Replit loads environment variables automatically)

console.log('🔍 معلومات قاعدة البيانات:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (process.env.DATABASE_URL) {
  console.log('✅ DATABASE_URL موجود!');
  
  // Extract info without showing the full URL for security
  const url = new URL(process.env.DATABASE_URL);
  console.log(`📡 Host: ${url.hostname}`);
  console.log(`🏷️  Database: ${url.pathname.slice(1)}`);
  console.log(`👤 User: ${url.username}`);
  console.log(`🌍 Full URL length: ${process.env.DATABASE_URL.length} characters`);
  
  console.log('\n🔗 رابط قاعدة البيانات للنسخ لفيرسل:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(process.env.DATABASE_URL);
} else {
  console.log('❌ DATABASE_URL غير موجود!');
  console.log('💡 تأكد من إنشاء قاعدة بيانات PostgreSQL في Replit');
}

console.log('\n📝 متغيرات البيئة المتاحة:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
Object.keys(process.env)
  .filter(key => key.includes('DATABASE') || key.includes('DB'))
  .forEach(key => {
    console.log(`${key}: ${process.env[key] ? '✅ موجود' : '❌ غير موجود'}`);
  });
