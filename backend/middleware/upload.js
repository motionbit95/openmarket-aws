const {
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const s3Client = require("../config/s3");

async function uploadFile({ bucketName, key, body, contentType }) {
  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    });
    await s3Client.send(command);
    return { key };
  } catch (err) {
    throw err;
  }
}

// S3에서 특정 prefix로 시작하는 모든 파일 삭제
async function deleteFilesByPrefix({ bucketName, prefix }) {
  try {
    // 1. 해당 prefix로 파일 목록 조회
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
    });
    const listedObjects = await s3Client.send(listCommand);

    if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
      return { deleted: 0 };
    }

    // 2. 삭제할 객체 목록 생성
    const deleteParams = {
      Bucket: bucketName,
      Delete: {
        Objects: listedObjects.Contents.map((item) => ({ Key: item.Key })),
        Quiet: true,
      },
    };

    const deleteCommand = new DeleteObjectsCommand(deleteParams);
    await s3Client.send(deleteCommand);

    return { deleted: listedObjects.Contents.length };
  } catch (err) {
    throw err;
  }
}

// S3에서 단일 파일 삭제
async function deleteFile({ bucketName, key }) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    await s3Client.send(command);
    return { key };
  } catch (err) {
    throw err;
  }
}

module.exports = { uploadFile, deleteFilesByPrefix, deleteFile };
