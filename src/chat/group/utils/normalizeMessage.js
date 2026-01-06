export function normalizeMessage(raw) {
  return {
    id: raw.id,

    cipherText: raw.cipherText,
    iv: raw.iv,

    // 🔑 SUPPORT BOTH NEW + OLD FIELD NAMES
    encryptedAesKeyForSender:
      raw.encryptedAesKeyForSender ?? raw.encryptedAesKey,

    encryptedAesKeyForReceiver:
      raw.encryptedAesKeyForReceiver ?? raw.encryptedAesKey,

    sender: raw.sender ?? {
      id: raw.senderId,
      username: raw.senderUsername,
    },

    timestamp: raw.createdAt || raw.timestamp || Date.now(),
  };
}
