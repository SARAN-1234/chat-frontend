export const getGroupName = (members, myUserId) => {
  return members
    .filter(m => m.userId !== myUserId)
    .map(m => m.username)
    .join(", ");
};
