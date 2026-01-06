/* =========================================================
   🔐 RSA KEY GENERATION (KEY EXCHANGE)
   ========================================================= */

export async function generateRSAKeyPair() {
  return await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
}

/* =========================================================
   📤 EXPORT RSA KEYS
   ========================================================= */

export async function exportPublicKey(publicKey) {
  const spki = await window.crypto.subtle.exportKey("spki", publicKey);
  return btoa(String.fromCharCode(...new Uint8Array(spki)));
}

export async function exportPrivateKey(privateKey) {
  const pkcs8 = await window.crypto.subtle.exportKey("pkcs8", privateKey);
  return btoa(String.fromCharCode(...new Uint8Array(pkcs8)));
}

/* =========================================================
   📥 IMPORT RSA KEYS
   ========================================================= */

export async function importPublicKey(base64Key) {
  const binary = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));

  return await window.crypto.subtle.importKey(
    "spki",
    binary.buffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
}

export async function importPrivateKey(base64Key) {
  const binary = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));

  return await window.crypto.subtle.importKey(
    "pkcs8",
    binary.buffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"]
  );
}

/* =========================================================
   🔒 AES (MESSAGE ENCRYPTION)
   ========================================================= */

export async function generateAESKey() {
  return await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function encryptWithAES(aesKey, plainText) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plainText);

  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encoded
  );

  return {
    cipherText: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

export async function decryptWithAES(aesKey, cipherText, iv) {
  const data = Uint8Array.from(atob(cipherText), c => c.charCodeAt(0));
  const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));

  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    aesKey,
    data
  );

  return new TextDecoder().decode(decrypted);
}

/* =========================================================
   🔑 RSA ↔ AES KEY WRAPPING
   ========================================================= */

export async function encryptAESKey(publicKey, aesKey) {
  const rawKey = await window.crypto.subtle.exportKey("raw", aesKey);

  const encryptedKey = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    rawKey
  );

  return btoa(String.fromCharCode(...new Uint8Array(encryptedKey)));
}

export async function decryptAESKey(privateKey, encryptedAesKey) {
  const binary = Uint8Array.from(atob(encryptedAesKey), c => c.charCodeAt(0));

  const rawKey = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    binary
  );

  // ✅ MUST allow BOTH encrypt & decrypt
  return await window.crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
}


