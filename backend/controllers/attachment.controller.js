const prisma = require("../config/prisma");
const {
  uploadFile,
  deleteFilesByPrefix,
  deleteFile,
} = require("../middleware/upload");
const { getDownloadUrl: getPresignedUrl } = require("../middleware/download");
const { convertBigIntToString } = require("../utils/bigint");
const {
  isValidImageFormat,
  generateMultipleImages,
  getOptimizationStats,
  generateUniqueFilename
} = require("../utils/imageOptimizer");
const path = require("path");

// 한글 파일명 깨짐 방지: S3 key에는 UUID 등 안전한 이름 사용, DB에는 원본 한글 파일명 저장

const { randomUUID } = require("crypto");

function getS3SafeKey({ type, id, originalname, prefix = "" }) {
  // 확장자 추출
  const ext = path.extname(originalname);
  // 안전한 UUID 기반 파일명 생성
  const uuid = randomUUID();
  // S3 key: {type}s/{id}/{timestamp}_{uuid}{ext}
  const key = `${prefix}${type ? type + "s/" : ""}${
    id ? id + "/" : ""
  }${Date.now()}_${uuid}${ext}`;
  return key;
}

exports.uploadAttachments = async (req, res) => {
  try {
    const { type, id } = req.params;
    const files = req.files;

    if (
      ![
        "notice",
        "guide",
        "error_report",
        "banner",
        "inquiry",
        "review",
        "product",
        "seller",
      ].includes(type)
    ) {
      return res.status(400).json({ message: "허용되지 않는 타입입니다." });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "파일이 필요합니다." });
    }

    const insertPromises = files.map(async (file) => {
      // S3 key는 안전하게 생성 (한글/특수문자 없음)
      const key = getS3SafeKey({ type, id, originalname: file.originalname });

      // S3 업로드
      await uploadFile({
        bucketName: process.env.MY_AWS_S3_BUCKET_NAME,
        key,
        body: file.buffer,
        contentType: file.mimetype,
      });

      // 업로드된 파일 접근 URL 생성
      const fileUrl = `https://${process.env.MY_AWS_S3_BUCKET_NAME}.s3.${process.env.MY_AWS_REGION}.amazonaws.com/${key}`;

      // Prisma DB 저장 (filename은 원본 한글 그대로)
      const created = await prisma.attachment.create({
        data: {
          target_type: type,
          target_id: BigInt(id),
          filename: file.originalname,
          url: fileUrl,
          s3_key: key,
          filesize: file.size,
          mimetype: file.mimetype,
        },
      });

      return convertBigIntToString(created);
    });

    const results = await Promise.all(insertPromises);

    res.status(201).json({ message: "업로드 성공", files: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 최적화된 이미지 업로드 (상품 이미지용)
 * POST /attachments/images/upload/:type/:id
 */
exports.uploadOptimizedImages = async (req, res) => {
  try {
    const { type, id } = req.params;
    const files = req.files;

    if (!["product", "seller", "banner"].includes(type)) {
      return res.status(400).json({ message: "이미지 최적화는 product, seller, banner 타입만 지원합니다." });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "파일이 필요합니다." });
    }

    const results = [];

    for (const file of files) {
      try {
        // 이미지 형식 검증
        if (!isValidImageFormat(file.mimetype)) {
          results.push({
            filename: file.originalname,
            error: "지원하지 않는 이미지 형식입니다."
          });
          continue;
        }

        // 고유 파일명 생성
        const uniqueFilename = generateUniqueFilename(file.originalname);
        
        // 최적화 통계
        let optimizationStats = null;

        // 다중 크기/형식 이미지 생성
        const imageVariants = await generateMultipleImages(file.buffer, uniqueFilename, {
          sizes: ['thumbnail', 'mobile', 'web'],
          formats: ['webp', 'jpeg'],
          generateOriginal: true
        });

        const uploadPromises = [];
        const dbInsertData = [];

        // 원본 이미지 업로드
        if (imageVariants.original) {
          const originalKey = `${type}s/${id}/original/${imageVariants.original.filename}`;
          
          uploadPromises.push(
            uploadFile({
              bucketName: process.env.MY_AWS_S3_BUCKET_NAME,
              key: originalKey,
              body: imageVariants.original.buffer,
              contentType: `image/${imageVariants.original.format}`,
            })
          );

          // 최적화 통계 계산
          optimizationStats = getOptimizationStats(file.buffer, imageVariants.original.buffer);

          dbInsertData.push({
            target_type: type,
            target_id: BigInt(id),
            filename: `${file.originalname}`,
            url: `https://${process.env.MY_AWS_S3_BUCKET_NAME}.s3.${process.env.MY_AWS_REGION}.amazonaws.com/${originalKey}`,
            s3_key: originalKey,
            filesize: imageVariants.original.size,
            mimetype: `image/${imageVariants.original.format}`
          });
        }

        // 다양한 크기/형식 변형 업로드
        for (const [size, formats] of Object.entries(imageVariants.variants)) {
          for (const [format, imageData] of Object.entries(formats)) {
            const variantKey = `${type}s/${id}/${size}/${imageData.filename}`;
            
            uploadPromises.push(
              uploadFile({
                bucketName: process.env.MY_AWS_S3_BUCKET_NAME,
                key: variantKey,
                body: imageData.buffer,
                contentType: `image/${format}`,
              })
            );

            dbInsertData.push({
              target_type: type,
              target_id: BigInt(id),
              filename: `${file.originalname}_${size}.${format}`,
              url: `https://${process.env.MY_AWS_S3_BUCKET_NAME}.s3.${process.env.MY_AWS_REGION}.amazonaws.com/${variantKey}`,
              s3_key: variantKey,
              filesize: imageData.size,
              mimetype: `image/${format}`
            });
          }
        }

        // 모든 S3 업로드 병렬 실행
        await Promise.all(uploadPromises);

        // DB에 모든 이미지 정보 저장
        const createdAttachments = await prisma.attachment.createMany({
          data: dbInsertData
        });

        results.push({
          filename: file.originalname,
          originalSize: file.size,
          optimizedCount: dbInsertData.length,
          optimizationStats,
          variants: Object.keys(imageVariants.variants),
          success: true
        });

      } catch (error) {
        console.error(`이미지 처리 실패 (${file.originalname}):`, error);
        results.push({
          filename: file.originalname,
          error: error.message,
          success: false
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    res.status(201).json({
      message: `${successCount}/${totalCount} 이미지가 성공적으로 최적화되어 업로드되었습니다.`,
      results
    });

  } catch (error) {
    console.error("이미지 업로드 오류:", error);
    res.status(500).json({ 
      error: "이미지 업로드에 실패했습니다.", 
      details: error.message 
    });
  }
};

exports.getDownloadUrl = async (req, res) => {
  try {
    const { key } = req.params;
    const url = await getPresignedUrl({
      bucketName: process.env.MY_AWS_S3_BUCKET_NAME,
      key,
      expiresIn: 60 * 5,
      // Content-Disposition 헤더를 통해 한글 파일명 다운로드 지원 (프론트에서 filename을 쿼리로 넘기면 더 좋음)
    });
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 임시 파일 업로드 (temp/{id} 폴더에 저장)
exports.uploadTempAttachments = async (req, res) => {
  try {
    const files = req.files;
    const { id } = req.params;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "파일이 필요합니다." });
    }

    const insertPromises = files.map(async (file) => {
      // S3 key는 안전하게 생성 (한글/특수문자 없음)
      const key = getS3SafeKey({
        type: "",
        id,
        originalname: file.originalname,
        prefix: "temp/",
      });

      // S3 업로드 (temp/{id} 폴더)
      await uploadFile({
        bucketName: process.env.MY_AWS_S3_BUCKET_NAME,
        key,
        body: file.buffer,
        contentType: file.mimetype,
      });

      // 업로드된 파일 접근 URL 생성
      const fileUrl = `https://${process.env.MY_AWS_S3_BUCKET_NAME}.s3.${process.env.MY_AWS_REGION}.amazonaws.com/${key}`;

      // 임시 파일은 DB에 저장하지 않음, URL만 반환
      return {
        filename: file.originalname,
        url: fileUrl,
        s3_key: key,
        filesize: file.size,
        mimetype: file.mimetype,
      };
    });

    const results = await Promise.all(insertPromises);

    res.status(201).json({ message: "임시 업로드 성공", files: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.uploadEditorAttachments = async (req, res) => {
  try {
    const files = req.files;
    const { id } = req.params;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "파일이 필요합니다." });
    }

    const insertPromises = files.map(async (file) => {
      // S3 key는 안전하게 생성 (한글/특수문자 없음)
      const key = getS3SafeKey({
        type: "",
        id,
        originalname: file.originalname,
        prefix: "editor/",
      });

      // S3 업로드 (editor/{id} 폴더)
      await uploadFile({
        bucketName: process.env.MY_AWS_S3_BUCKET_NAME,
        key,
        body: file.buffer,
        contentType: file.mimetype,
      });

      // 업로드된 파일 접근 URL 생성
      const fileUrl = `https://${process.env.MY_AWS_S3_BUCKET_NAME}.s3.${process.env.MY_AWS_REGION}.amazonaws.com/${key}`;

      console.log(fileUrl);

      // 임시 파일은 DB에 저장하지 않음, URL만 반환
      return {
        filename: file.originalname,
        url: fileUrl,
        s3_key: key,
        filesize: file.size,
        mimetype: file.mimetype,
      };
    });

    const results = await Promise.all(insertPromises);

    res.status(201).json({ message: "임시 업로드 성공", files: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// temp/{id} 폴더 내 모든 파일 삭제
exports.clearTempFolder = async (req, res) => {
  try {
    const { id } = req.params;
    // deleteFilesByPrefix는 S3에서 해당 prefix로 시작하는 모든 파일을 삭제하는 함수여야 합니다.
    await deleteFilesByPrefix({
      bucketName: process.env.MY_AWS_S3_BUCKET_NAME,
      prefix: `temp/${id}/`,
    });
    res.json({ message: `temp/${id} 폴더의 모든 파일이 삭제되었습니다.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 첨부파일 여러개 삭제
exports.deleteAttachment = async (req, res) => {
  try {
    // ids는 배열로 body로 받음
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ message: "삭제할 첨부파일 id 배열이 필요합니다." });
    }

    // 1. DB에서 첨부파일 정보 조회
    const attachments = await prisma.attachment.findMany({
      where: {
        id: { in: ids.map((id) => BigInt(id)) },
      },
    });

    // 없는 id가 있을 경우
    const foundIds = attachments.map((a) => a.id.toString());
    const notFoundIds = ids.filter((id) => !foundIds.includes(id.toString()));
    if (notFoundIds.length > 0) {
      return res.status(404).json({
        message: `다음 첨부파일을 찾을 수 없습니다: ${notFoundIds.join(", ")}`,
      });
    }

    // 2. S3에서 파일 삭제
    const deleteS3Promises = attachments.map((att) => {
      if (att.s3_key) {
        return deleteFile({
          bucketName: process.env.MY_AWS_S3_BUCKET_NAME,
          key: att.s3_key,
        });
      }
      return Promise.resolve();
    });
    await Promise.all(deleteS3Promises);

    // 3. DB에서 레코드 삭제
    await prisma.attachment.deleteMany({
      where: {
        id: { in: ids.map((id) => BigInt(id)) },
      },
    });

    res.json({
      message: "첨부파일이 성공적으로 삭제되었습니다.",
      deletedIds: ids,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.prisma = prisma;
