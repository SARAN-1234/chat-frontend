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
  const connectedRef = useRef(false);

  useEffect(() => {
    if (!auth?.userId || connectedRef.current) return;

    /* 🔹 1️⃣ LOAD INITIAL PRESENCE FROM BACKEND (DB) */
    api.get("/users/presence").then((res) => {
      const initial = {};
      res.data.forEach((p) => {
        initial[p.userId] = p;
      });
      setPresenceMap(initial);
    });

    /* 🔹 2️⃣ CONNECT WEBSOCKET */
    connectWebSocket(() => {
      connectedRef.current = true;

      /* 🔹 REAL-TIME PRESENCE */
      subscribeToPresence((data) => {
        setPresenceMap((prev) => ({
          ...prev,
          [Number(data.userId)]: data,
        }));
      });

      /* 🔹 CALL SIGNALS */
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
  }, [auth]);

  return { presenceMap, incomingCall, setIncomingCall };
}
