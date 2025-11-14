const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('배너 데이터 조회 중...');
    const banners = await prisma.banners.findMany({ take: 5 });
    console.log(`✅ 배너 ${banners.length}개 발견`);
    
    console.log('\n공지사항 데이터 조회 중...');
    const notices = await prisma.Notice.findMany({ take: 5 });
    console.log(`✅ 공지사항 ${notices.length}개 발견`);
    
    console.log('\n가이드 데이터 조회 중...');
    const guides = await prisma.UserGuide.findMany({ take: 5 });
    console.log(`✅ 가이드 ${guides.length}개 발견`);
    
    console.log('\n오류제보 데이터 조회 중...');
    const reports = await prisma.ErrorReport.findMany({ take: 5 });
    console.log(`✅ 오류제보 ${reports.length}개 발견`);
    
    console.log('\n✅ 모든 데이터 조회 성공!');
  } catch (error) {
    console.error('❌ 데이터베이스 에러:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
