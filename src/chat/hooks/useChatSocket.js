import { useEffect, useRef, useState } from "react";
import {
  connectWebSocket,
  subscribeToPresence,
  subscribeToCallSignals,
} from "../../services/websocket";
import { initAudioCall, closeCall } from "../../services/callService";
import api from "../../api/api";

export default function useChatSocket(auth) {
  const [presenceMap, setPresenceMap] = useState({});
  const [incomingCall, setIncomingCall] = useState(null);

  const connectingRef = useRef(false); // 🔥 NEW
  const connectedRef = useRef(false);

  useEffect(() => {
    if (!auth?.userId) return;

    // 🔥 allow retry if connection failed before
    if (connectingRef.current || connectedRef.current) return;

    connectingRef.current = true;

    console.log("🔌 Initializing WebSocket for user", auth.userId);

    // Load presence snapshot (REST)
    api.get("/users/presence").then((res) => {
      const initial = {};
      res.data.forEach((p) => {
        initial[p.userId] = p;
      });
      setPresenceMap(initial);
    });

    connectWebSocket(() => {
      console.log("✅ WebSocket fully connected");

      connectedRef.current = true;
      connectingRef.current = false;

      subscribeToPresence((data) => {
        setPresenceMap((prev) => ({
          ...prev,
          [Number(data.userId)]: data,
        }));
      });

      subscribeToCallSignals((signal) => {
        if (signal.type === "CALL_REQUEST") {
          setIncomingCall({
            userId: signal.fromUserId,
            username: signal.fromUsername,
          });
        }

        if (signal.type === "CALL_REJECT") closeCall();
        if (signal.type === "CALL_ACCEPTED")
          initAudioCall(signal.payload);
      });
    });

    // 🔁 retry safeguard
    const retryTimer = setTimeout(() => {
      if (!connectedRef.current) {
        console.warn("🔁 Retrying WebSocket connection");
        connectingRef.current = false;
      }
    }, 5000);

    return () => clearTimeout(retryTimer);
  }, [auth?.userId]);

  return { presenceMap, incomingCall, setIncomingCall };
}
