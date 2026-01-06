/* =====================================================
   GROUP CRYPTO UTILS – E2EE SAFE (FINAL)
   ===================================================== */

import {
  importPrivateKey,
  decryptAESKey,
  decryptWithAES,
  encryptWithAES,
} from "./crypto";

/* =========================================
   🔐 GROUP KEY CACHE
   ========================================= */
const groupKeyCache = new Map();

/* =========================================
   🔑 GET + DECRYPT GROUP AES KEY
   ========================================= */
export async function getGroupAESKey({
  groupId,
  encryptedGroupKey,
  encryptedGroupKeys,
  myUserId,
}) {
  // ✅ Cache hit
  if (groupKeyCache.has(groupId)) {
    return groupKeyCache.get(groupId);
  }

  const privateKeyBase64 = localStorage.getItem("privateKey");
  if (!privateKeyBase64) {
    throw new Error("Private key missing");
  }

  if (!encryptedGroupKeys || typeof encryptedGroupKeys !== "object") {
    throw new Error("encryptedGroupKeys missing");
  }

  // 🔥 JSON keys are STRINGS
  const encryptedKey = encryptedGroupKeys[String(myUserId)];

  if (!encryptedKey) {
    throw new Error(`No encrypted group key for user ${myUserId}`);
  }

  const privateKey = await importPrivateKey(privateKeyBase64);
  const aesKey = await decryptAESKey(privateKey, encryptedKey);

  groupKeyCache.set(groupId, aesKey);
  return aesKey;
}

/* =========================================
   🔐 ENCRYPT GROUP MESSAGE
   ========================================= */
export async function encryptGroupMessage(groupAESKey, plainText) {
  return encryptWithAES(groupAESKey, plainText);
}

/* =========================================
   🔓 DECRYPT GROUP MESSAGE
   ========================================= */
export async function decryptGroupMessage({
  groupAESKey,
  cipherText,
  iv,
}) {
  return decryptWithAES(groupAESKey, cipherText, iv);
}

/* =========================================
   🧹 CLEAR CACHE (LOGOUT)
   ========================================= */
export function clearGroupKeyCache() {
  groupKeyCache.clear();
}
