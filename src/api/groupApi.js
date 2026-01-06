import api from "./api";

/* ===============================
   GROUP CHAT APIs (FIXED)
   =============================== */

// ✅ Create group (E2EE SAFE)
export const createGroup = ({ name, memberIds }) =>
  api.post("/chatroom/group/create", {
    name,
    memberIds,
  });

// ✅ Get groups I belong to (includes encryptedGroupKeys)
export const getMyGroups = () =>
  api.get("/chatroom/group/my");

// Get group members
export const getGroupMembers = (groupId) =>
  api.get(`/chatroom/group/${groupId}/members`);

// Add member (admin only)
export const addGroupMember = (groupId, userId) =>
  api.post(`/chatroom/group/${groupId}/add/${userId}`);

// Leave group
export const leaveGroup = (groupId) =>
  api.post(`/chatroom/group/${groupId}/leave`);
