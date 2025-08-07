// Script to update production database schema
// Run this locally with your production DATABASE_URL

const { execSync } = require('child_process');

console.log('Updating production database schema...');

try {
  // Generate Prisma Client
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Push schema to production database
  execSync('npx prisma db push --skip-seed', { stdio: 'inherit' });
  
  console.log('✅ Database schema updated successfully!');
} catch (error) {
  console.error('❌ Error updating database:', error.message);
  process.exit(1);
}