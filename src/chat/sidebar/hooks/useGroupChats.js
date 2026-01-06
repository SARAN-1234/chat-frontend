import { useEffect, useState } from "react";
import { getMyGroups } from "../../../api/groupApi";

const useGroupChats = () => {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    getMyGroups()
      .then((res) => {
        const normalized = res.data.map((g) => ({
          id: g.id,
          roomId: g.roomId,
          name: g.name,
          memberCount: g.memberCount,

          // 🔐 CRITICAL — DO NOT DROP THIS
          encryptedGroupKeys: g.encryptedGroupKeys ?? {},

          type: "GROUP",
        }));

        setGroups(normalized);
      })
      .catch((err) => {
        console.error("Failed to load groups", err);
      });
  }, []);

  return { groups };
};

export default useGroupChats;
