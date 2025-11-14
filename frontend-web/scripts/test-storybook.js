#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");

console.log("🚀 스토리북 테스트 환경을 시작합니다...\n");

// 스토리북 시작
console.log("📚 스토리북을 시작합니다...");
const storybook = spawn("npm", ["run", "storybook"], {
  stdio: "pipe",
  shell: true,
});

storybook.stdout.on("data", (data) => {
  const output = data.toString();
  console.log(output);

  // 스토리북이 준비되면 테스트 실행
  if (output.includes("Local:")) {
    console.log("\n✅ 스토리북이 준비되었습니다!");
    console.log("🌐 브라우저에서 http://localhost:6006 을 열어 확인하세요.\n");

    // 5초 후 테스트 실행
    setTimeout(() => {
      console.log("🧪 스토리북 테스트를 실행합니다...");
      const testRunner = spawn("npm", ["run", "test-storybook"], {
        stdio: "inherit",
        shell: true,
      });

      testRunner.on("close", (code) => {
        console.log(`\n📊 테스트 완료 (종료 코드: ${code})`);
        process.exit(code);
      });
    }, 5000);
  }
});

storybook.stderr.on("data", (data) => {
  console.error(`❌ 스토리북 오류: ${data}`);
});

storybook.on("close", (code) => {
  console.log(`\n📚 스토리북 종료 (종료 코드: ${code})`);
});

// 프로세스 종료 처리
process.on("SIGINT", () => {
  console.log("\n🛑 프로세스를 종료합니다...");
  storybook.kill("SIGINT");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 프로세스를 종료합니다...");
  storybook.kill("SIGTERM");
  process.exit(0);
});
