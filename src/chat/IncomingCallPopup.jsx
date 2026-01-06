import "./chat.css";

const IncomingCallPopup = ({ caller, onAccept, onReject }) => {
  if (!caller) return null;

  return (
    <div className="call-popup">
      <p>📞 Incoming call from</p>
      <h3>{caller.username}</h3>

      <div className="call-actions">
        <button className="accept" onClick={onAccept}>
          ✅ Accept
        </button>
        <button className="reject" onClick={onReject}>
          ❌ Reject
        </button>
      </div>
    </div>
  );
};

export default IncomingCallPopup;
