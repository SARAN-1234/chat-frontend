import http from "./api";

export const sendEmail = async (data) => {
  const res = await http.post("/email/send", data);
  return res.data;
};
