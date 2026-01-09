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

    api.get("/users/presence").then((res) => {
      const initial = {};
      res.data.forEach((p) => {
        initial[p.userId] = p;
      });
      setPresenceMap(initial);
    });

    connectWebSocket(() => {
      connectedRef.current = true;

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
  }, [auth?.userId]);

  return { presenceMap, incomingCall, setIncomingCall };
}
