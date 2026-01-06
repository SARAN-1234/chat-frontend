let peerConnection = null;
let localStream = null;

/* ===============================
   🎙️ INIT AUDIO CALL
   =============================== */
export async function initAudioCall() {
  localStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false,
  });

  peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  // Attach local audio track
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  return peerConnection;
}

/* ===============================
   🔁 GET PEER CONNECTION
   =============================== */
export function getPeerConnection() {
  return peerConnection;
}

/* ===============================
   ❌ CLOSE CALL
   =============================== */
export function closeCall() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  if (localStream) {
    localStream.getTracks().forEach((t) => t.stop());
    localStream = null;
  }
}
