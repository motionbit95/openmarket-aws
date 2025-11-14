#!/usr/bin/env node

/**
 * 개발 환경 설정 및 실행 스크립트
 * 프론트엔드와 백엔드를 동시에 실행하고 관리합니다.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// 로그 헬퍼 함수
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  frontend: (msg) => console.log(`${colors.cyan}[FRONTEND]${colors.reset} ${msg}`),
  backend: (msg) => console.log(`${colors.magenta}[BACKEND]${colors.reset} ${msg}`),
};

// 경로 설정
const ROOT_DIR = path.resolve(__dirname, '../../../');
const FRONTEND_DIR = path.resolve(__dirname, '../');
const BACKEND_DIR = path.resolve(ROOT_DIR, 'openmarket-backend');

// 프로세스 저장용
let frontendProcess = null;
let backendProcess = null;

// 환경 체크
function checkEnvironment() {
  log.info('환경을 확인하는 중...');

  // 백엔드 디렉토리 존재 확인
  if (!fs.existsSync(BACKEND_DIR)) {
    log.error(`백엔드 디렉토리를 찾을 수 없습니다: ${BACKEND_DIR}`);
    return false;
  }

  // 백엔드 package.json 확인
  const backendPackageJson = path.join(BACKEND_DIR, 'package.json');
  if (!fs.existsSync(backendPackageJson)) {
    log.error('백엔드 package.json을 찾을 수 없습니다.');
    return false;
  }

  // 프론트엔드 .env.local 확인
  const envLocal = path.join(FRONTEND_DIR, '.env.local');
  if (!fs.existsSync(envLocal)) {
    log.warning('.env.local 파일이 없습니다. 기본값을 사용합니다.');
  }

  log.success('환경 확인 완료');
  return true;
}

// 백엔드 서버 시작
function startBackend() {
  return new Promise((resolve, reject) => {
    log.info('백엔드 서버를 시작하는 중...');

    backendProcess = spawn('npm', ['run', 'dev'], {
      cwd: BACKEND_DIR,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    backendProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        log.backend(output);
      }

      // 서버가 시작되었는지 확인
      if (output.includes('Server listening') || output.includes('🚀')) {
        log.success('백엔드 서버가 시작되었습니다.');
        resolve();
      }
    });

    backendProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output && !output.includes('nodemon')) {
        log.backend(`stderr: ${output}`);
      }
    });

    backendProcess.on('error', (error) => {
      log.error(`백엔드 서버 시작 실패: ${error.message}`);
      reject(error);
    });

    backendProcess.on('close', (code) => {
      if (code !== 0) {
        log.error(`백엔드 서버가 종료되었습니다. 코드: ${code}`);
      }
    });

    // 타임아웃 설정 (10초)
    setTimeout(() => {
      if (backendProcess && !backendProcess.killed) {
        log.success('백엔드 서버가 시작된 것으로 가정합니다.');
        resolve();
      }
    }, 10000);
  });
}

// 프론트엔드 서버 시작
function startFrontend() {
  return new Promise((resolve, reject) => {
    log.info('프론트엔드 서버를 시작하는 중...');

    frontendProcess = spawn('npm', ['run', 'dev'], {
      cwd: FRONTEND_DIR,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    frontendProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        log.frontend(output);
      }

      // 서버가 시작되었는지 확인
      if (output.includes('Ready in') || output.includes('Local:')) {
        log.success('프론트엔드 서버가 시작되었습니다.');
        resolve();
      }
    });

    frontendProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output && !output.includes('experiment')) {
        log.frontend(`stderr: ${output}`);
      }
    });

    frontendProcess.on('error', (error) => {
      log.error(`프론트엔드 서버 시작 실패: ${error.message}`);
      reject(error);
    });

    frontendProcess.on('close', (code) => {
      if (code !== 0) {
        log.error(`프론트엔드 서버가 종료되었습니다. 코드: ${code}`);
      }
    });

    // 타임아웃 설정 (15초)
    setTimeout(() => {
      if (frontendProcess && !frontendProcess.killed) {
        log.success('프론트엔드 서버가 시작된 것으로 가정합니다.');
        resolve();
      }
    }, 15000);
  });
}

// 프로세스 종료 핸들러
function cleanup() {
  log.info('서버들을 종료하는 중...');

  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill('SIGTERM');
  }

  if (frontendProcess && !frontendProcess.killed) {
    frontendProcess.kill('SIGTERM');
  }

  setTimeout(() => {
    process.exit(0);
  }, 2000);
}

// 시그널 핸들러 등록
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// 메인 함수
async function main() {
  try {
    log.info('개발 환경을 설정하는 중...');

    // 환경 확인
    if (!checkEnvironment()) {
      process.exit(1);
    }

    // 백엔드 서버 시작
    await startBackend();
    
    // 잠시 대기 (백엔드가 완전히 시작될 때까지)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 프론트엔드 서버 시작
    await startFrontend();

    log.success('모든 서버가 시작되었습니다!');
    log.info('개발을 시작할 수 있습니다.');
    log.info('Ctrl+C를 눌러 모든 서버를 종료할 수 있습니다.');

    // 무한 대기
    process.stdin.resume();

  } catch (error) {
    log.error(`설정 실패: ${error.message}`);
    cleanup();
  }
}

// 실행
if (require.main === module) {
  main();
}

module.exports = { main, cleanup };