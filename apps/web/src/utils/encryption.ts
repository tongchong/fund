import crypto from "crypto";

// 确保密钥长度为32字节 (AES-256需要32字节密钥)
const ENCRYPTION_KEY_STRING = "tinyGarlicRag2024SecretKey1234567890";
const ENCRYPTION_KEY = Buffer.from(ENCRYPTION_KEY_STRING.padEnd(32, "0").slice(0, 32), "utf8");
const IV_LENGTH = 16; // AES块大小

export function encryptApiKey(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

export function decryptApiKey(encryptedText: string): string {
  const textParts = encryptedText.split(":");
  const iv = Buffer.from(textParts.shift()!, "hex");
  const encryptedData = textParts.join(":");
  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
