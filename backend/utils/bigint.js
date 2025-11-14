function convertBigIntToString(data) {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(convertBigIntToString);
  }
  
  if (typeof data === "bigint") {
    return data.toString();
  }
  
  if (data instanceof Date) {
    return data;
  }
  
  if (typeof data === "object") {
    const result = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = convertBigIntToString(value);
    }
    return result;
  }
  
  return data;
}

function parseBigIntId(id) {
  if (typeof id === "bigint") {
    return id;
  }
  
  if (typeof id === "string" && /^\d+$/.test(id)) {
    return BigInt(id);
  }
  
  if (typeof id === "number" && Number.isInteger(id) && id > 0) {
    return BigInt(id);
  }
  
  throw new Error("유효하지 않은 ID 형식입니다.");
}

module.exports = {
  convertBigIntToString,
  parseBigIntId,
};