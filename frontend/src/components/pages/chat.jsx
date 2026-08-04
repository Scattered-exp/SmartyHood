import EmojiPicker from "emoji-picker-react";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io("https://smartyhood.onrender.com", {
  autoConnect: false,
});
const ROOM = "neet-general";

const BORDER_COLORS = [
  "#a78bfa", // violet
  "#34d399", // emerald
  "#f472b6", // pink
  "#60a5fa", // blue
  "#fb923c", // orange
  "#facc15", // yellow
];

function getBorderColor(sender) {
  if (sender === "You") return "#a78bfa";
  let hash = 0;
  for (let c of sender) hash = c.charCodeAt(0) + hash * 31;
  return BORDER_COLORS[Math.abs(hash) % BORDER_COLORS.length];
}

function Message({ msg, isOwn }) {
  const time = new Date(msg.timestamp || Date.now()).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const borderColor = isOwn ? "#22c55e" : "#ff9de1";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isOwn ? "row-reverse" : "row",
        marginBottom: 14,
        animation: "fadeUp 0.18s ease-out",
      }}
    >
      <div
        style={{
          maxWidth: "85%",
          display: "flex",
          flexDirection: "column",
          alignItems: isOwn ? "flex-end" : "flex-start",
          gap: 4,
        }}
      >
        <div
          style={{
            background: "#1a1a2e",
            color: "#e2e8f0",
            padding: "10px 14px",
            borderRadius: isOwn ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
            fontSize: 14,
            lineHeight: 1.55,
            border: `1.5px solid ${borderColor}`,
            wordBreak: "break-word",
            boxShadow: `0 0 10px ${borderColor}22`,
          }}
        >
          {msg.message}
        </div>
        <span style={{ fontSize: 10, color: "#4a5568", paddingInline: 4 }}>{time}</span>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", marginBottom: 12 }}>
      <div
        style={{
          background: "#1a1a2e",
          border: "1.5px solid #4a5568",
          borderRadius: "4px 16px 16px 16px",
          padding: "10px 16px",
          display: "flex",
          gap: 5,
          alignItems: "center",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#a78bfa",
              animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Chat() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [typing, setTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
   const [myId, setMyId] = useState("");
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);
  const inputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  useEffect(() => {
    socket.connect();
    socket.on("connect", () => {
  setConnected(true);
  setMyId(socket.id);
  socket.emit("join_room", ROOM);
  
});
    socket.on("disconnect", () => setConnected(false));
    socket.on("online_users", (count) => {
  setOnlineUsers(count);
});
    socket.emit("join_room", ROOM);
    socket.on("receive_message", (data) => {
      setChat((prev) => [...prev, data]);
    });
    socket.on("user_typing", () => {
      setTyping(true);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => setTyping(false), 2000);
    });
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, typing]);
  useEffect(() => {
    const input = inputRef.current;

    const handleFocus = () => {
        setTimeout(() => {
            bottomRef.current?.scrollIntoView({
                behavior: "smooth"
            });
        }, 300);
    };

    input?.addEventListener("focus", handleFocus);

    return () => {
        input?.removeEventListener("focus", handleFocus);
    };
}, []);
  useEffect(() => {
  const handleClickOutside = (event) => {
    if (
      emojiPickerRef.current &&
      !emojiPickerRef.current.contains(event.target)
    ) {
      setShowEmojiPicker(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);


  const sendMessage = () => {
  if (!message.trim()) return;

  const data = {
    room: ROOM,
    message: message.trim(),
    sender: socket.id,
    timestamp: Date.now()
  };

  socket.emit("send_message", data);

  setMessage("");
  inputRef.current?.focus();
};

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    socket.emit("typing", { room: ROOM });
  };
  const onEmojiClick = (emojiData) => {
  setMessage((prev) => prev + emojiData.emoji);
};

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .chat-root {
          font-family: 'Inter', sans-serif;
          height: 100dvh;
          display: flex;
          flex-direction: column;
          background: #0d0d1a;
        }

        .chat-header {
          background: #11112a;
          border-bottom: 1px solid #1e1e3f;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }

        .header-title {
          font-size: 15px;
          font-weight: 600;
          color: #e2e8f0;
          letter-spacing: -0.01em;
        }

        .header-sub {
          font-size: 11px;
          color: #4a5568;
          margin-top: 2px;
        }

        .conn-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 500;
          color: #718096;
          background: #1a1a2e;
          padding: 5px 12px;
          border-radius: 20px;
          border: 1px solid #2d2d52;
        }

        .conn-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        .messages-area {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 16px;
    scroll-behavior: smooth;
}

        .messages-area::-webkit-scrollbar { width: 3px; }
        .messages-area::-webkit-scrollbar-track { background: transparent; }
        .messages-area::-webkit-scrollbar-thumb { background: #2d2d52; border-radius: 4px; }

        .date-divider {
          text-align: center;
          margin: 12px 0 20px;
          position: relative;
        }
        .date-divider::before {
          content: '';
          position: absolute;
          top: 50%; left: 0; right: 0;
          height: 1px;
          background: #1e1e3f;
        }
        .date-divider span {
          position: relative;
          background: #0d0d1a;
          padding: 0 12px;
          font-size: 10px;
          color: #4a5568;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 240px;
          gap: 8px;
          color: #2d2d52;
        }
        .empty-state p { font-size: 13px; color: #4a5568; }

        .input-area {
          background: #11112a;
          border-top: 1px solid #1e1e3f;
          padding: 12px 16px;
          display: flex;
          align-items: flex-end;
          gap: 10px;
          flex-shrink: 0;
        }

        .input-wrap {
          flex: 1;
          background: #1a1a2e;
          border: 1px solid #2d2d52;
          border-radius: 20px;
          display: flex;
          align-items: center;
          padding: 0 14px;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .input-wrap:focus-within {
          border-color: #a78bfa;
          box-shadow: 0 0 0 3px rgba(167,139,250,0.1);
        }

        .chat-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          color: #e2e8f0;
          padding: 10px 0;
          resize: none;
          line-height: 1.5;
          max-height: 120px;
        }
        .chat-input::placeholder { color: #4a5568; }

        .send-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #a78bfa;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.15s, background 0.15s;
        }
        .send-btn:hover { background: #c4b5fd; transform: scale(1.06); }
        .send-btn:active { transform: scale(0.94); }
        .send-btn:disabled { background: #2d2d52; cursor: default; transform: none; }
        .send-btn svg {
          width: 16px; height: 16px;
          fill: none; stroke: #0d0d1a;
          stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round;
          transform: translateX(1px);
        }
        .send-btn:disabled svg { stroke: #4a5568; }
        @media (max-width: 768px) {

  .chat-header {
    padding: 10px 12px;
  }

  .header-title {
    font-size: 14px;
  }

  .header-sub {
    font-size: 10px;
  }

  .conn-pill {
    font-size: 10px;
    padding: 4px 8px;
  }

  .messages-area {
    padding: 10px;
  }

  .input-area {
    padding: 8px;
  }

  .chat-input {
    font-size: 16px;
  }

}
      `}</style>

      <div className="chat-root">
        <div className="chat-header">
          <div>
  <div className="header-title">SmartyHood Chat</div>
  <div className="header-sub">neet-general</div>

  <div
    style={{
      color: "#34d399",
      fontSize: "12px",
      marginTop: "4px",
      fontWeight: "600"
    }}
  >
    🟢 {onlineUsers} Users Online
  </div>
</div>
          <div className="conn-pill">
            <div
              className="conn-dot"
              style={{ background: connected ? "#34d399" : "#f87171" }}
            />
            {connected ? "Connected" : "Offline"}
          </div>
        </div>

        <div className="messages-area">
          <div className="date-divider"><span>Today</span></div>

          {chat.length === 0 ? (
            <div className="empty-state">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2d2d52" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <p>No messages yet. Say something!</p>
            </div>
          ) : (
            chat.map((msg, i) => (
              <Message
    key={i}
    msg={msg}
    isOwn={msg.sender === myId}
/>
            ))
          )}

          {typing && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        <div className="input-area">
          <div ref={emojiPickerRef} style={{ position: "relative" }}>

    <button
      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
      style={{
        background: "transparent",
        border: "none",
        fontSize: "22px",
        cursor: "pointer",
        color: "white"
      }}
    >
      😊
    </button>

    {showEmojiPicker && (
      <div
        style={{
          position: "absolute",
          bottom: "50px",
          left: "0",
          zIndex: 1000
        }}
      >
        <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
      </div>
    )}

  </div>
          <div className="input-wrap">
            <textarea
              ref={inputRef}
              className="chat-input"
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              rows={1}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
            />
          </div>
          <button
            className="send-btn"
            onClick={sendMessage}
            disabled={!message.trim()}
            aria-label="Send"
          >
            <svg viewBox="0 0 24 24">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}