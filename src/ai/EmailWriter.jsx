import { useState } from "react";
import api from "../api/api";

const EmailWriter = () => {
  const [form, setForm] = useState({
    purpose: "",
    tone: "PROFESSIONAL",
    recipient: "",
    senderName: ""
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    const res = await api.post("/ai/email/generate", form);
    setResult(res.data);
    setLoading(false);
  };

  return (
    <div className="email-writer">
      <h2>AI Email Writer ✨</h2>

      <input placeholder="Purpose"
        onChange={e => setForm({ ...form, purpose: e.target.value })} />

      <input placeholder="Recipient"
        onChange={e => setForm({ ...form, recipient: e.target.value })} />

      <input placeholder="Your Name"
        onChange={e => setForm({ ...form, senderName: e.target.value })} />

      <select
        onChange={e => setForm({ ...form, tone: e.target.value })}
      >
        <option>PROFESSIONAL</option>
        <option>FRIENDLY</option>
        <option>APOLOGY</option>
      </select>

      <button onClick={generate}>
        {loading ? "Generating..." : "Generate Email"}
      </button>

      {result && (
        <>
          <h3>{result.subject}</h3>
          <textarea rows={10} value={result.body} readOnly />
        </>
      )}
    </div>
  );
};

export default EmailWriter;
