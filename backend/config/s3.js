const { S3Client } = require("@aws-sdk/client-s3");

// AWS SDK가 자동으로 자격 증명을 찾도록 설정
// 우선순위: 환경변수 > AWS credentials 파일 > EC2 인스턴스 메타데이터
const s3Client = new S3Client({
  region: process.env.MY_AWS_REGION || process.env.AWS_REGION || "ap-northeast-2",
  // credentials를 명시하지 않으면 AWS SDK의 기본 자격 증명 체인 사용
  ...(process.env.MY_AWS_ACCESS_KEY_ID && process.env.MY_AWS_SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
        },
      }
    : {}),
});

module.exports = s3Client;
