#!/bin/bash

# 빠른 재구축 (로그 최소화)
echo "🚀 빠른 DB 재구축 시작..."

# 순차 실행
node prisma/seed-scripts/01-reset-database.js > /dev/null 2>&1 && echo "✅ DB 초기화"
node prisma/seed-scripts/02-basic-data.js > /dev/null 2>&1 && echo "✅ 기본 데이터"
node prisma/seed-scripts/03-options-and-reviews.js > /dev/null 2>&1 && echo "✅ 옵션 & 리뷰"  
node prisma/seed-scripts/04-cart-and-orders.js > /dev/null 2>&1 && echo "✅ 장바구니 & 주문"
node prisma/seed-scripts/05-support-and-files.js > /dev/null 2>&1 && echo "✅ 고객지원 & 파일"

echo ""
echo "🎉 DB 재구축 완료!"
echo "📊 현황 확인: npm run check-db"