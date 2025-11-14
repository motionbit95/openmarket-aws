/**
 * Image Processor Lambda Function
 *
 * S3에 이미지가 업로드되면 자동으로 여러 크기의 썸네일 생성
 * - Original: 유지
 * - Large: 1200x1200
 * - Medium: 800x800
 * - Small: 400x400
 * - Thumbnail: 200x200
 *
 * Trigger: S3 Event (ObjectCreated)
 * Input: S3 Event
 * Output: Processed images saved to S3
 */

const AWS = require('aws-sdk');
const sharp = require('sharp');

const s3 = new AWS.S3();

// 이미지 크기 설정
const IMAGE_SIZES = {
  large: { width: 1200, height: 1200 },
  medium: { width: 800, height: 800 },
  small: { width: 400, height: 400 },
  thumbnail: { width: 200, height: 200 }
};

/**
 * Lambda Handler
 */
exports.handler = async (event) => {
  console.log('Image Processor Lambda triggered', JSON.stringify(event, null, 2));

  try {
    // S3 이벤트 파싱
    const record = event.Records[0];
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    console.log(`Processing image: ${bucket}/${key}`);

    // 이미지가 이미 처리된 것인지 확인 (무한 루프 방지)
    if (key.includes('/processed/')) {
      console.log('Image already processed, skipping...');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Already processed' })
      };
    }

    // 원본 이미지만 처리 (uploads/ 경로만)
    if (!key.startsWith('uploads/')) {
      console.log('Not an upload image, skipping...');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Not an upload image' })
      };
    }

    // S3에서 원본 이미지 가져오기
    const imageObject = await s3.getObject({
      Bucket: bucket,
      Key: key
    }).promise();

    const imageBuffer = imageObject.Body;
    const contentType = imageObject.ContentType;

    // 지원하는 이미지 타입 확인
    if (!contentType.startsWith('image/')) {
      console.log('Not an image file, skipping...');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Not an image file' })
      };
    }

    // 파일 경로 파싱
    const pathParts = key.split('/');
    const fileName = pathParts.pop();
    const basePath = pathParts.join('/');

    // 각 크기별로 이미지 리사이징 및 업로드
    const uploadPromises = Object.entries(IMAGE_SIZES).map(async ([sizeName, dimensions]) => {
      try {
        // Sharp를 사용한 이미지 리사이징
        const resizedImage = await sharp(imageBuffer)
          .resize(dimensions.width, dimensions.height, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .toBuffer();

        // 새 이미지 경로 생성
        const newKey = `${basePath}/processed/${sizeName}/${fileName}`;

        // S3에 업로드
        await s3.putObject({
          Bucket: bucket,
          Key: newKey,
          Body: resizedImage,
          ContentType: contentType,
          CacheControl: 'max-age=31536000', // 1년
          Metadata: {
            'original-key': key,
            'size': sizeName,
            'processed-at': new Date().toISOString()
          }
        }).promise();

        console.log(`Uploaded ${sizeName}: ${newKey}`);

        return {
          size: sizeName,
          key: newKey,
          dimensions
        };
      } catch (error) {
        console.error(`Error processing ${sizeName}:`, error);
        throw error;
      }
    });

    const results = await Promise.all(uploadPromises);

    console.log('Image processing completed', results);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Image processed successfully',
        originalKey: key,
        processedImages: results
      })
    };

  } catch (error) {
    console.error('Error processing image:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error processing image',
        error: error.message
      })
    };
  }
};
