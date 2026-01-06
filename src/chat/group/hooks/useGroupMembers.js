import { useEffect, useState } from "react";
import { getMyGroups } from "../../../api/groupApi"; // ✅ FIXED PATH

const useGroupChats = () => {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    getMyGroups()
      .then((res) => setGroups(res.data))
      .catch((err) =>
        console.error("Failed to load groups", err)
      );
  }, []);

  return { groups };
};

export default useGroupChats;
