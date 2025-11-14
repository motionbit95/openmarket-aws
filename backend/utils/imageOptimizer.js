const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const mime = require('mime-types');

// imagemin 관련 모듈들을 동적으로 로드 (ES Module 지원)
let imagemin, imageminMozjpeg, imageminPngquant, imageminWebp;
let imageminModulesLoaded = false;
let imageminLoadAttempted = false;

async function loadImageminModules() {
  if (imageminModulesLoaded) return true;
  if (imageminLoadAttempted) return false; // 이미 시도했고 실패한 경우
  
  imageminLoadAttempted = true;
  
  try {
    // Jest 환경에서는 동적 import가 제한적이므로 try-catch로 처리
    if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
      // Jest 환경에서는 ImageMin 기능을 비활성화하고 fallback 사용
      console.warn('테스트 환경에서는 ImageMin 라이브러리가 비활성화됩니다.');
      return false;
    }
    
    // ES Module을 동적으로 import
    const imageminModule = await import('imagemin');
    const imageminMozjpegModule = await import('imagemin-mozjpeg');
    const imageminPngquantModule = await import('imagemin-pngquant');
    const imageminWebpModule = await import('imagemin-webp');
    
    imagemin = imageminModule.default || imageminModule;
    imageminMozjpeg = imageminMozjpegModule.default || imageminMozjpegModule;
    imageminPngquant = imageminPngquantModule.default || imageminPngquantModule;
    imageminWebp = imageminWebpModule.default || imageminWebpModule;
    
    imageminModulesLoaded = true;
    console.log('✅ ImageMin 라이브러리 로드 성공');
    return true;
  } catch (error) {
    console.warn('ImageMin 라이브러리를 로드할 수 없습니다. 고급 최적화 기능이 비활성화됩니다.');
    console.warn('로드 오류 상세:', error.message);
    return false;
  }
}

// 이미지 크기 설정
const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150 },
  mobile: { width: 400, height: 400 },
  web: { width: 800, height: 800 },
  original: { width: 1200, height: 1200 }
};

// 품질 설정
const QUALITY_SETTINGS = {
  jpeg: 80,
  webp: 80,
  png: 80
};

/**
 * 이미지 정보 추출
 * @param {Buffer} imageBuffer - 이미지 버퍼
 * @returns {Promise<Object>} 이미지 메타데이터
 */
async function getImageInfo(imageBuffer) {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    return {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      size: metadata.size || imageBuffer.length,
      hasAlpha: metadata.hasAlpha || false
    };
  } catch (error) {
    throw new Error(`이미지 정보 추출 실패: ${error.message}`);
  }
}

/**
 * 이미지 형식 검증
 * @param {string} mimetype - MIME 타입
 * @returns {boolean} 지원되는 형식 여부
 */
function isValidImageFormat(mimetype) {
  const supportedFormats = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif',
    'image/bmp',
    'image/tiff'
  ];
  return supportedFormats.includes(mimetype.toLowerCase());
}

/**
 * 이미지 리사이징
 * @param {Buffer} imageBuffer - 원본 이미지 버퍼
 * @param {string} sizeName - 크기 이름 (thumbnail, mobile, web, original)
 * @param {Object} options - 추가 옵션
 * @returns {Promise<Buffer>} 리사이징된 이미지 버퍼
 */
async function resizeImage(imageBuffer, sizeName, options = {}) {
  try {
    const sizeConfig = IMAGE_SIZES[sizeName];
    if (!sizeConfig) {
      throw new Error(`지원하지 않는 이미지 크기: ${sizeName}`);
    }

    const { width, height } = sizeConfig;
    const {
      fit = 'cover', // cover, contain, fill, inside, outside
      position = 'center', // center, top, bottom, left, right
      background = { r: 255, g: 255, b: 255, alpha: 1 },
      withoutEnlargement = true
    } = options;

    let sharpInstance = sharp(imageBuffer)
      .resize(width, height, {
        fit,
        position,
        background,
        withoutEnlargement
      });

    // 메타데이터 제거로 파일 크기 감소
    sharpInstance = sharpInstance.withMetadata(false);

    return await sharpInstance.toBuffer();
  } catch (error) {
    throw new Error(`이미지 리사이징 실패: ${error.message}`);
  }
}

/**
 * 이미지 압축 (JPEG/PNG/WebP)
 * @param {Buffer} imageBuffer - 이미지 버퍼
 * @param {string} format - 압축할 형식 (jpeg, png, webp)
 * @param {number} quality - 압축 품질 (1-100)
 * @returns {Promise<Buffer>} 압축된 이미지 버퍼
 */
async function compressImage(imageBuffer, format = 'jpeg', quality = null) {
  try {
    const compressionQuality = quality || QUALITY_SETTINGS[format] || 80;
    
    let compressedBuffer;
    
    if (format === 'webp') {
      // WebP 변환 및 압축
      compressedBuffer = await sharp(imageBuffer)
        .webp({ 
          quality: compressionQuality,
          effort: 4 // 압축 노력 수준 (0-6, 높을수록 더 좋은 압축)
        })
        .toBuffer();
    } else if (format === 'jpeg' || format === 'jpg') {
      // JPEG 압축
      compressedBuffer = await sharp(imageBuffer)
        .jpeg({ 
          quality: compressionQuality,
          progressive: true, // 프로그레시브 JPEG
          mozjpeg: true // MozJPEG 엔코더 사용
        })
        .toBuffer();
    } else if (format === 'png') {
      // PNG 압축
      compressedBuffer = await sharp(imageBuffer)
        .png({ 
          quality: compressionQuality,
          compressionLevel: 9, // 최대 압축
          adaptiveFiltering: true
        })
        .toBuffer();
    } else {
      throw new Error(`지원하지 않는 압축 형식: ${format}`);
    }

    return compressedBuffer;
  } catch (error) {
    throw new Error(`이미지 압축 실패: ${error.message}`);
  }
}

/**
 * 고급 이미지 최적화 (imagemin 사용)
 * @param {Buffer} imageBuffer - 이미지 버퍼
 * @param {string} format - 이미지 형식
 * @returns {Promise<Buffer>} 최적화된 이미지 버퍼
 */
async function optimizeImageAdvanced(imageBuffer, format) {
  try {
    // imagemin 모듈 동적 로드
    const imageminAvailable = await loadImageminModules();
    if (!imageminAvailable) {
      return imageBuffer;
    }

    let plugins = [];
    
    if (format === 'jpeg' || format === 'jpg') {
      plugins = [
        imageminMozjpeg({
          quality: QUALITY_SETTINGS.jpeg,
          progressive: true
        })
      ];
    } else if (format === 'png') {
      plugins = [
        imageminPngquant({
          quality: [0.6, 0.8], // 품질 범위
          speed: 4 // 속도 vs 품질 (1-10)
        })
      ];
    } else if (format === 'webp') {
      plugins = [
        imageminWebp({
          quality: QUALITY_SETTINGS.webp,
          method: 4 // 압축 방법 (0-6)
        })
      ];
    }

    if (plugins.length === 0) {
      return imageBuffer; // 최적화 불가능한 형식
    }

    const optimizedBuffer = await imagemin.buffer(imageBuffer, { plugins });
    return optimizedBuffer;
  } catch (error) {
    console.warn(`고급 최적화 실패, 기본 버퍼 반환: ${error.message}`);
    return imageBuffer;
  }
}

/**
 * 다중 크기/형식 이미지 생성
 * @param {Buffer} originalBuffer - 원본 이미지 버퍼
 * @param {string} filename - 파일명 (확장자 제외)
 * @param {Object} options - 옵션
 * @returns {Promise<Object>} 생성된 이미지들 정보
 */
async function generateMultipleImages(originalBuffer, filename, options = {}) {
  try {
    const {
      sizes = ['thumbnail', 'mobile', 'web'],
      formats = ['webp', 'jpeg'], // WebP 우선, JPEG 폴백
      generateOriginal = true
    } = options;

    const results = {
      original: null,
      variants: {}
    };

    // 원본 이미지 정보
    const imageInfo = await getImageInfo(originalBuffer);
    
    // 원본 최적화 (용량이 클 경우)
    if (generateOriginal) {
      let originalOptimized = originalBuffer;
      
      // 원본이 너무 큰 경우 리사이징
      if (imageInfo.width > IMAGE_SIZES.original.width || imageInfo.height > IMAGE_SIZES.original.height) {
        originalOptimized = await resizeImage(originalBuffer, 'original');
      }
      
      // 원본 압축
      const originalFormat = imageInfo.format === 'png' ? 'png' : 'jpeg';
      originalOptimized = await compressImage(originalOptimized, originalFormat);
      originalOptimized = await optimizeImageAdvanced(originalOptimized, originalFormat);
      
      results.original = {
        buffer: originalOptimized,
        filename: `${filename}.${originalFormat}`,
        format: originalFormat,
        size: originalOptimized.length,
        width: Math.min(imageInfo.width, IMAGE_SIZES.original.width),
        height: Math.min(imageInfo.height, IMAGE_SIZES.original.height)
      };
    }

    // 다양한 크기/형식 생성
    for (const size of sizes) {
      results.variants[size] = {};
      
      for (const format of formats) {
        try {
          // 리사이징
          let resizedBuffer = await resizeImage(originalBuffer, size);
          
          // 형식 변환 및 압축
          let optimizedBuffer = await compressImage(resizedBuffer, format);
          
          // 고급 최적화
          optimizedBuffer = await optimizeImageAdvanced(optimizedBuffer, format);
          
          results.variants[size][format] = {
            buffer: optimizedBuffer,
            filename: `${filename}_${size}.${format}`,
            format: format,
            size: optimizedBuffer.length,
            width: IMAGE_SIZES[size].width,
            height: IMAGE_SIZES[size].height
          };
        } catch (error) {
          console.warn(`${size}/${format} 변환 실패: ${error.message}`);
        }
      }
    }

    return results;
  } catch (error) {
    throw new Error(`다중 이미지 생성 실패: ${error.message}`);
  }
}

/**
 * 이미지 최적화 통계
 * @param {Buffer} originalBuffer - 원본 버퍼
 * @param {Buffer} optimizedBuffer - 최적화된 버퍼
 * @returns {Object} 최적화 통계
 */
function getOptimizationStats(originalBuffer, optimizedBuffer) {
  const originalSize = originalBuffer.length;
  const optimizedSize = optimizedBuffer.length;
  const reduction = originalSize - optimizedSize;
  const reductionPercent = Math.round((reduction / originalSize) * 100);
  
  return {
    originalSize,
    optimizedSize,
    reduction,
    reductionPercent,
    compressionRatio: (optimizedSize / originalSize).toFixed(3)
  };
}

/**
 * 파일명 생성 (타임스탬프 + UUID)
 * @param {string} originalName - 원본 파일명
 * @returns {string} 고유한 파일명 (확장자 제외)
 */
function generateUniqueFilename(originalName = '') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const baseName = path.parse(originalName).name.replace(/[^a-zA-Z0-9]/g, '') || 'image';
  return `${timestamp}_${random}_${baseName}`;
}

module.exports = {
  loadImageminModules,
  getImageInfo,
  isValidImageFormat,
  resizeImage,
  compressImage,
  optimizeImageAdvanced,
  generateMultipleImages,
  getOptimizationStats,
  generateUniqueFilename,
  IMAGE_SIZES,
  QUALITY_SETTINGS
};