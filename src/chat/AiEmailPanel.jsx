import { useEffect, useState } from "react";
import { generateAiEmail } from "../api/emailAiApi";
import { sendEmail } from "../api/emailSendApi";
import "./chat.css";

const AiEmailPanel = ({ recipient, senderName, onClose }) => {
  const [purpose, setPurpose] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [subject, setSubject] = useState("");

  const [finalRecipient, setFinalRecipient] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");

  /* ===============================
     🔁 SYNC RECIPIENT FROM PROPS
     =============================== */
  useEffect(() => {
    if (recipient) {
      setFinalRecipient(recipient);
      setStatus("");
    } else {
      setFinalRecipient("");
      setStatus("Recipient email not available");
    }
  }, [recipient]);

  /* ===============================
     🤖 GENERATE EMAIL
     =============================== */
  const handleGenerate = async () => {
    if (!purpose.trim()) {
      setStatus("Purpose is required");
      return;
    }

    if (!finalRecipient) {
      setStatus("Recipient email not available");
      return;
    }

    try {
      setLoading(true);
      setStatus("");

      const res = await generateAiEmail({
        recipient: finalRecipient,
        purpose,
        senderName,
      });

      setSubject(res.subject);
      setEmailBody(res.body);
    } catch (err) {
      setStatus("❌ Failed to generate email");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     📤 SEND EMAIL
     =============================== */
  const handleSend = async () => {
    if (!emailBody || !subject) {
      setStatus("Email content missing");
      return;
    }

    try {
      setSending(true);
      setStatus("");

      await sendEmail({
        to: finalRecipient,
        subject,
        body: emailBody,
      });

      setStatus("✅ Email sent successfully");
    } catch (err) {
      setStatus("❌ Failed to send email");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="ai-email-box">
      {/* HEADER */}
      <div className="ai-email-header">
        <h3>🤖 AI Email Generator</h3>
        <button onClick={onClose}>✖</button>
      </div>

      {/* RECIPIENT */}
      <input
        value={finalRecipient}
        readOnly
        placeholder="Recipient email"
      />

      {/* PURPOSE */}
      <textarea
        placeholder="Purpose of the email"
        value={purpose}
        onChange={(e) => setPurpose(e.target.value)}
      />

      <button
        onClick={handleGenerate}
        disabled={loading || !finalRecipient}
      >
        {loading ? "Generating..." : "Generate Email"}
      </button>

      {/* PREVIEW */}
      {emailBody && (
        <>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
          />

          <textarea
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            rows={8}
          />

          <button onClick={handleSend} disabled={sending}>
            {sending ? "Sending..." : "Send Email"}
          </button>
        </>
      )}

      {status && <p className="ai-status">{status}</p>}
    </div>
  );
};

export default AiEmailPanel;
