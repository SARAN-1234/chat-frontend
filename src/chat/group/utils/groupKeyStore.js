import {
  importPrivateKey,
  decryptAESKey,
  decryptWithAES,
  encryptWithAES,
} from "./crypto";

/* =========================================
   GROUP KEY CACHE
   key = `${groupId}:${userId}`
   ========================================= */
const groupKeyCache = new Map();

/* =========================================
   GET / DECRYPT GROUP AES KEY
   ========================================= */
export async function getGroupAESKey({
  groupId,
  encryptedGroupKeys,
  myUserId,
}) {
  if (!groupId) {
    throw new Error("groupId missing");
  }

  if (!myUserId) {
    throw new Error("myUserId missing");
  }

  const cacheKey = `${groupId}:${myUserId}`;

  // ✅ Return cached key
  if (groupKeyCache.has(cacheKey)) {
    return groupKeyCache.get(cacheKey);
  }

  if (!encryptedGroupKeys) {
    throw new Error("encryptedGroupKeys missing");
  }

  const encryptedKey = encryptedGroupKeys[myUserId];

  if (!encryptedKey) {
    throw new Error(
      `No encrypted group key for user ${myUserId}`
    );
  }

  const privateKeyBase64 = localStorage.getItem("privateKey");

  if (!privateKeyBase64) {
    throw new Error("Private key missing");
  }

  const privateKey = await importPrivateKey(privateKeyBase64);

  const aesKey = await decryptAESKey(privateKey, encryptedKey);

  // ✅ Cache decrypted AES key
  groupKeyCache.set(cacheKey, aesKey);

  return aesKey;
}

/* =========================================
   CLEAR GROUP KEY CACHE
   (use on logout / key rotation)
   ========================================= */
export function clearGroupKey(groupId) {
  [...groupKeyCache.keys()]
    .filter((k) => k.startsWith(groupId + ":"))
    .forEach((k) => groupKeyCache.delete(k));
}

/* =========================================
   ENCRYPT GROUP MESSAGE
   ========================================= */
export async function encryptGroupMessage({
  groupAESKey,
  plainText,
}) {
  if (!groupAESKey) {
    throw new Error("Group AES key missing");
  }

  if (!plainText) {
    throw new Error("Message empty");
  }

  return encryptWithAES(groupAESKey, plainText);
}

/* =========================================
   DECRYPT GROUP MESSAGE
   ========================================= */
export async function decryptGroupMessage({
  groupAESKey,
  cipherText,
  iv,
}) {
  if (!groupAESKey || !cipherText || !iv) {
    throw new Error("Invalid decrypt inputs");
  }

  return decryptWithAES(groupAESKey, cipherText, iv);
}
