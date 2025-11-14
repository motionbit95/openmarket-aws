const prisma = require("../config/prisma");
const { convertBigIntToString, parseBigIntId } = require("../utils/bigint");

// 전체 배송지 목록 (optionally by userId)
exports.getAllAddresses = async (req, res) => {
  try {
    const { userId } = req.query;
    let where = {};
    if (userId) {
      try {
        where.userId = parseBigIntId(userId);
      } catch (error) {
        return res.status(400).json({ message: "유효하지 않은 userId입니다." });
      }
    }
    const addresses = await prisma.userAddress.findMany({ where });
    if (!addresses || addresses.length === 0) {
      return res.status(200).json([]); // 목록이 없으면 빈 배열 반환
    }
    res.json(convertBigIntToString(addresses));
  } catch (error) {
    res.status(500).json({ message: "서버 에러", error });
  }
};

// 특정 유저의 배송지 목록 조회
exports.getAddressesByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    let userIdBigInt;
    try {
      userIdBigInt = parseBigIntId(userId);
    } catch (parseError) {
      return res.status(400).json({ message: "유효하지 않은 userId입니다." });
    }
    const addresses = await prisma.userAddress.findMany({
      where: { userId: userIdBigInt },
    });
    res.json(convertBigIntToString(addresses));
  } catch (error) {
    res.status(500).json({ message: "서버 에러", error });
  }
};

// 특정 배송지 조회
exports.getAddressById = async (req, res) => {
  try {
    const { id } = req.params;
    let idBigInt;
    try {
      idBigInt = parseBigIntId(id);
    } catch (parseError) {
      return res.status(400).json({ message: "유효하지 않은 주소 ID입니다." });
    }
    const address = await prisma.userAddress.findUnique({
      where: { id: idBigInt },
    });
    if (!address) {
      return res.status(404).json({ message: "배송지를 찾을 수 없습니다." });
    }
    res.json(convertBigIntToString(address));
  } catch (error) {
    res.status(500).json({ message: "서버 에러", error });
  }
};

// 배송지 생성
exports.createAddress = async (req, res) => {
  try {
    const {
      userId,
      recipient,
      phone,
      postcode,
      address1,
      address2,
      isDefault,
      memo,
    } = req.body;

    if (!userId || !recipient || !phone || !postcode || !address1) {
      return res.status(400).json({ message: "필수 항목이 누락되었습니다." });
    }

    // isDefault가 true면 해당 유저의 기존 기본 배송지 해제
    if (isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId: parseBigIntId(userId), isDefault: true },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.userAddress.create({
      data: {
        userId: parseBigIntId(userId),
        recipient,
        phone,
        postcode,
        address1,
        address2,
        isDefault: !!isDefault,
        memo,
      },
    });
    res.status(201).json(convertBigIntToString(newAddress));
  } catch (error) {
    res.status(500).json({ message: "배송지 생성 실패", error });
  }
};

// 배송지 수정
exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const idBigInt = parseBigIntId(id);
    const { recipient, phone, postcode, address1, address2, isDefault, memo } =
      req.body;

    // isDefault가 true면 해당 유저의 기존 기본 배송지 해제
    let address = await prisma.userAddress.findUnique({
      where: { id: idBigInt },
    });
    if (!address) {
      return res.status(404).json({ message: "배송지를 찾을 수 없습니다." });
    }

    if (isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId: address.userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updatedAddress = await prisma.userAddress.update({
      where: { id: idBigInt },
      data: {
        recipient,
        phone,
        postcode,
        address1,
        address2,
        isDefault: !!isDefault,
        memo,
      },
    });
    res.json(convertBigIntToString(updatedAddress));
  } catch (error) {
    res.status(500).json({ message: "배송지 수정 실패", error });
  }
};

// 배송지 삭제
exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const idBigInt = parseBigIntId(id);

    // 기본배송지 여부 확인
    const address = await prisma.userAddress.findUnique({
      where: { id: idBigInt },
    });
    if (!address) {
      return res
        .status(404)
        .json({ message: "삭제할 배송지를 찾을 수 없습니다." });
    }
    if (address.isDefault) {
      return res
        .status(400)
        .json({ message: "기본배송지는 삭제할 수 없습니다." });
    }

    await prisma.userAddress.delete({
      where: { id: idBigInt },
    });
    res.json({ message: "배송지 삭제 완료" });
  } catch (error) {
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ message: "삭제할 배송지를 찾을 수 없습니다." });
    }
    res.status(500).json({ message: "배송지 삭제 실패", error });
  }
};
