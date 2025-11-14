const { PrismaClient } = require("@prisma/client");
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function main() {
  console.log("🗑️  데이터베이스 초기화 시작...");
  
  try {
    // Prisma를 사용한 강제 리셋
    console.log("📊 데이터베이스 스키마 리셋 중...");
    
    // 자식 프로세스로 prisma db push --force-reset 실행
    execSync('npx prisma db push --force-reset', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log("✅ 데이터베이스 초기화 완료!");
    
  } catch (error) {
    console.error("❌ 데이터베이스 초기화 중 오류:", error);
    throw error;
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });