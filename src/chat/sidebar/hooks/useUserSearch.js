import { useEffect, useState } from "react";
import api from "../../../api/api";

export default function useUserSearch() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!search.trim()) {
      setUsers([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.get(
          `/users/search?q=${encodeURIComponent(search)}`
        );
        setUsers(res.data);
      } catch (err) {
        console.error("❌ User search failed", err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [search]);

  return {
    search,
    setSearch,
    users,
    loading,
  };
}

