import http from "./api";

export const generateAiEmail = async (data) => {
  const res = await http.post("/ai/email/generate", data);
  return res.data;
};
