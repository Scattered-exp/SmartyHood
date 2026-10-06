import EmojiPicker from "emoji-picker-react";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://smartyhood-1.onrender.com");

const socket = io(BACKEND_URL, {
  autoConnect: false,
});

const ROOM = "neet-general";

const BORDER_COLORS = [
  "#a78bfa",
  "#34d399",
  "#f472b6",
  "#60a5fa",
  "#fb923c",
  "#facc15",
];

function Message({ msg, isOwn, onDelete }) {
  if (msg.type === "system") {
  return (
    <div
      style={{
        textAlign: "center",
        color: "#64748b",
        fontSize: 12,
        margin: "12px 0",
      }}
    >
      {msg.message}
    </div>
  );
}
  const [showMenu, setShowMenu] = useState(false);

  const time = new Date(
    msg.timestamp || Date.now()
  ).toLocaleTimeString([], {
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
            position: "relative",
            background: "#1a1a2e",
            color: "#e2e8f0",
            padding: msg.type === "media" ? "5px" : "10px 14px",
            borderRadius: isOwn
              ? "16px 4px 16px 16px"
              : "4px 16px 16px 16px",
            fontSize: 14,
            lineHeight: 1.55,
            border: `1.5px solid ${borderColor}`,
            wordBreak: "break-word",
            boxShadow: `0 0 10px ${borderColor}22`,
            overflow: "visible",
          }}
        >
          {msg.type === "media" ? (
            <MediaMessage msg={msg} />
          ) : (
            msg.message
          )}

          {/* THREE DOT MENU - OWN MESSAGES ONLY */}
          {isOwn && (
            <div
              style={{
                position: "absolute",
                top: 4,
                right: 5,
              }}
            >
              <button
                onClick={() => setShowMenu((prev) => !prev)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  fontSize: 18,
                  lineHeight: 1,
                  padding: "2px 4px",
                }}
              >
                ⋮
              </button>

              {showMenu && (
                <div
                  style={{
                    position: "absolute",
                    top: 25,
                    right: 0,
                    background: "#11112a",
                    border: "1px solid #2d2d52",
                    borderRadius: 8,
                    padding: 5,
                    minWidth: 150,
                    zIndex: 1000,
                    boxShadow: "0 8px 25px rgba(0,0,0,0.4)",
                  }}
                >
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(msg.id);
                    }}
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      color: "#f87171",
                      padding: "9px 10px",
                      textAlign: "left",
                      cursor: "pointer",
                      fontSize: 13,
                      borderRadius: 6,
                    }}
                  >
                    🗑️ Delete for Everyone
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <span
          style={{
            fontSize: 10,
            color: "#4a5568",
            paddingInline: 4,
          }}
        >
          {time}
        </span>
      </div>
    </div>
  );
}

function MediaMessage({ msg }) {
  const [mediaUrl, setMediaUrl] = useState("");

  useEffect(() => {
    if (!msg.file) return;

    let url;

    try {
      const blob =
        msg.file instanceof Blob
          ? msg.file
          : new Blob([msg.file], {
              type: msg.mimeType || "application/octet-stream",
            });

      url = URL.createObjectURL(blob);
      setMediaUrl(url);
    } catch (error) {
      console.error("Could not create media URL:", error);
    }

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [msg.file, msg.mimeType]);

  if (!mediaUrl) {
    return (
      <div
        style={{
          color: "#94a3b8",
          padding: "15px",
          fontSize: 12,
        }}
      >
        Loading media...
      </div>
    );
  }

  if (msg.mediaType === "image") {
    return (
      <img
        src={mediaUrl}
        alt="Shared"
        draggable="false"
        onContextMenu={(e) => e.preventDefault()}
        style={{
          display: "block",
          maxWidth: "280px",
          maxHeight: "350px",
          width: "100%",
          objectFit: "cover",
          borderRadius: 12,
          userSelect: "none",
        }}
      />
    );
  }

  return (
    <video
      src={mediaUrl}
      controls
      controlsList="nodownload noplaybackrate"
      disablePictureInPicture
      playsInline
      onContextMenu={(e) => e.preventDefault()}
      style={{
        display: "block",
        maxWidth: "300px",
        maxHeight: "400px",
        width: "100%",
        borderRadius: 12,
        background: "#000",
      }}
    />
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
  const [chatAccess, setChatAccess] = useState("loading"); // "loading" | "allowed" | "full" | "error"
  const [limitInfo, setLimitInfo] = useState({ maxUsers: 3, onlineUsers: 3, message: "" });
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [publicUsers, setPublicUsers] = useState([]);
  // console.log("PUBLIC USERS:", publicUsers);
  const [typing, setTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [myId, setMyId] = useState("");

  const [cameraOpen, setCameraOpen] = useState(false);
const [cameraMode, setCameraMode] = useState("photo");
const [recording, setRecording] = useState(false);


  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);
  const inputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const messagesRef = useRef(null);

  const galleryInputRef = useRef(null);

  const cameraVideoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  useEffect(() => {
    const handleConnect = () => {
      console.log("Frontend connected:", socket.id);

      setConnected(true);
      setMyId(socket.id);

      socket.emit("join_room", ROOM);
    };

    const handleDisconnect = () => {
      console.log("Frontend disconnected");
      setConnected(false);
    };

    const handleConnectError = (err) => {
      console.error("Socket connection error:", err);
      if (err?.message === "CHAT_FULL") {
        setChatAccess("full");
      } else {
        setChatAccess("error");
      }
    };

    const handleYourIdentity = (identity) => {
      console.log("Admitted to chat room:", identity);
      setConnected(true);
      setChatAccess("allowed");
    };

    const handleChatUnavailable = (data) => {
      console.warn("Chat unavailable - 3 users limit reached:", data);
      setLimitInfo({
        maxUsers: data?.maxUsers || 3,
        onlineUsers: data?.onlineUsers || 3,
        message: data?.message || "Public chat is currently full. Maximum 3 users are allowed.",
      });
      setChatAccess("full");
      setConnected(false);
      socket.disconnect();
    };

    const handleOnlineUsers = (count) => {
      console.log("Online users:", count);
      setOnlineUsers(count);
    };

    const handlePublicChatUsers = (users) => {
  setPublicUsers(users);
};

    const handleReceiveMessage = (data) => {
      console.log("Message received:", data);

      setChat((prev) => [...prev, data]);
    };
    const handleMessageDeleted = (data) => {
  setChat((prev) =>
    prev.filter((msg) => msg.id !== data.messageId)
  );
};

    const handleClearChat = () => {
      setChat([]);
    };

    const handleTyping = () => {
      setTyping(true);

      clearTimeout(typingTimeout.current);

      typingTimeout.current = setTimeout(() => {
        setTyping(false);
      }, 2000);
    };
    const handleUserLeft = (user) => {
  console.log(`User ${user.userNumber} left the chat`);

  setChat((prev) => [
    ...prev,
    {
      id: `system-left-${user.userId}-${Date.now()}`,
      type: "system",
      message: `User ${user.userNumber} left the chat`,
      timestamp: Date.now(),
    },
  ]);
};

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("your_identity", handleYourIdentity);
    socket.on("chat_unavailable", handleChatUnavailable);
    socket.on("online_users", handleOnlineUsers);
    socket.on("public_chat_users", handlePublicChatUsers);
    socket.on("receive_message", handleReceiveMessage);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("clear_chat", handleClearChat);
    socket.on("user_typing", handleTyping);
    socket.on("user_left", handleUserLeft);

    socket.connect();

    return () => {
      /*
        Clear the temporary chat for everyone when leaving
        the chat room.
      */
      socket.emit("leave_chat", ROOM);

      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("your_identity", handleYourIdentity);
      socket.off("chat_unavailable", handleChatUnavailable);
      socket.off("online_users", handleOnlineUsers);
      socket.off("public_chat_users", handlePublicChatUsers);
      socket.off("receive_message", handleReceiveMessage);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("clear_chat", handleClearChat);
      socket.off("user_typing", handleTyping);
      socket.off("user_left", handleUserLeft);

      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [chat, typing]);

  useEffect(() => {
    const input = inputRef.current;

    const handleFocus = () => {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({
          behavior: "smooth",
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
  id: `${socket.id}-${Date.now()}-${Math.random()}`,
  room: ROOM,
  type: "text",
  message: message.trim(),
  sender: socket.id,
  timestamp: Date.now(),
};

    socket.emit("send_message", data);

    setMessage("");

    inputRef.current?.focus();
  };
  // ==============================
  // DELETE MESSAGE FOR EVERYONE
  // ==============================
  const deleteMessage = (messageId) => {
    const msg = chat.find((item) => item.id === messageId);

    if (!msg) {
      console.error("Message not found:", messageId);
      return;
    }

    // Only the original sender can delete the message.
    if (msg.sender !== myId) {
      console.error("You can only delete your own messages.");
      return;
    }

    if (!socket.connected) {
      console.error("Socket is not connected.");
      return;
    }

    socket.emit("delete_message", {
      room: ROOM,
      messageId: messageId,
      sender: myId,
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);

    socket.emit("typing", {
      room: ROOM,
    });
  };

  const onEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
  };

  // ==============================
  // GALLERY
  // ==============================

  const openGallery = () => {
    galleryInputRef.current?.click();
  };

  const handleGallerySelect = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      alert("Please select an image or video.");
      return;
    }

    // 40 MB safety limit
    if (file.size > 40 * 1024 * 1024) {
      alert("File is too large. Please select a file under 40 MB.");
      e.target.value = "";
      return;
    }

    sendMedia(file);

    e.target.value = "";
  };

  // ==============================
  // MEDIA SENDING
  // ==============================

  const sendMedia = (file) => {
    const mediaType = file.type.startsWith("image/")
      ? "image"
      : "video";

    const data = {
  id: `${socket.id}-${Date.now()}-${Math.random()}`,
  room: ROOM,
  type: "media",
  mediaType,
  mimeType: file.type,
  file,
  sender: socket.id,
  timestamp: Date.now(),
};

    socket.emit("send_message", data);
  };

  // ==============================
  // CAMERA
  // ==============================

 const openCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
      },
      audio: true,
    });

    cameraStreamRef.current = stream;

    setCameraMode("photo");
    setCameraOpen(true);

    setTimeout(() => {
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;

        cameraVideoRef.current.play().catch((error) => {
          console.log("Camera play error:", error);
        });
      }
    }, 100);

  } catch (error) {
    console.error("Camera error:", error);

    alert(
      "Camera access was denied or is not available. Please allow camera permission."
    );
  }
};


 const stopCamera = () => {
  // Stop all camera/microphone tracks
  if (cameraStreamRef.current) {
    cameraStreamRef.current.getTracks().forEach((track) => {
      track.stop();
    });
    cameraStreamRef.current = null;
  }

  // Completely disconnect video element
  if (cameraVideoRef.current) {
    cameraVideoRef.current.pause();
    cameraVideoRef.current.srcObject = null;
  }

  // Stop recording timer
  if (recordingTimerRef.current) {
    clearInterval(recordingTimerRef.current);
    recordingTimerRef.current = null;
  }

  // Clear recorder
  mediaRecorderRef.current = null;
  recordedChunksRef.current = [];

  // Reset camera state
  setRecording(false);
  setRecordingSeconds(0);
  setCameraOpen(false);
};

  const capturePhoto = () => {
  const video = cameraVideoRef.current;

  if (!video || !video.videoWidth || !video.videoHeight) {
    alert("Camera is not ready yet. Please wait a moment.");
    return;
  }

  const canvas = document.createElement("canvas");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const context = canvas.getContext("2d");

  context.drawImage(
    video,
    0,
    0,
    canvas.width,
    canvas.height
  );

  canvas.toBlob(
    (blob) => {
      if (!blob) {
        alert("Could not capture photo.");
        return;
      }

      const file = new File(
        [blob],
        `smartyhood-photo-${Date.now()}.jpg`,
        {
          type: "image/jpeg",
        }
      );

      // Close camera immediately
      stopCamera();

      // Send photo
      sendMedia(file);
    },
    "image/jpeg",
    0.85
  );
};

  const startVideoRecording = () => {
    if (!cameraStreamRef.current) return;

    recordedChunksRef.current = [];

    let options = {
      mimeType: "video/webm;codecs=vp8,opus",
    };

    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = {
        mimeType: "video/webm",
      };
    }

    const recorder = new MediaRecorder(
      cameraStreamRef.current,
      options
    );

    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, {
        type: recorder.mimeType || "video/webm",
      });

      if (blob.size > 40 * 1024 * 1024) {
        alert("Video is too large to send.");
        recordedChunksRef.current = [];
        return;
      }

      const file = new File(
        [blob],
        `smartyhood-snap-${Date.now()}.webm`,
        {
          type: blob.type,
        }
      );

      sendMedia(file);

      recordedChunksRef.current = [];
      setRecording(false);
      setRecordingSeconds(0);

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      stopCamera();
    };

    recorder.start();

    setRecording(true);
    setRecordingSeconds(0);

    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => {
        const next = prev + 1;

        // Automatically stop at 30 seconds
        if (next >= 30) {
          if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
          }
        }

        return next;
      });
    }, 1000);
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(6px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce {
          0%, 60%, 100% {
            transform: translateY(0);
          }

          30% {
            transform: translateY(-5px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }

          50% {
            opacity: 0.3;
          }
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

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

        .messages-area::-webkit-scrollbar {
          width: 3px;
        }

        .messages-area::-webkit-scrollbar-track {
          background: transparent;
        }

        .messages-area::-webkit-scrollbar-thumb {
          background: #2d2d52;
          border-radius: 4px;
        }

        .date-divider {
          text-align: center;
          margin: 12px 0 20px;
          position: relative;
        }

        .date-divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
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
        }

        .empty-state p {
          font-size: 13px;
          color: #4a5568;
        }

        .input-area {
  background: #11112a;
  border-top: 1px solid #1e1e3f;
  padding: 10px 8px;
  display: flex;
  align-items: flex-end;
  gap: 5px;
  flex-shrink: 0;
  width: 100%;
  min-width: 0;
}

        .input-wrap {
  flex: 1;
  min-width: 0;
  max-width: 100%;
  background: #1a1a2e;
  border: 1px solid #2d2d52;
  border-radius: 20px;
  display: flex;
  align-items: center;
  padding: 0 14px;
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

        .chat-input::placeholder {
          color: #4a5568;
        }

        .media-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #1a1a2e;
          border: 1px solid #2d2d52;
          color: #c4b5fd;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .media-btn:hover {
          background: #24243d;
          transform: scale(1.05);
        }

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
        }

        .send-btn:hover {
          background: #c4b5fd;
          transform: scale(1.06);
        }

        .send-btn:disabled {
          background: #2d2d52;
          cursor: default;
          transform: none;
        }

        .send-btn svg {
          width: 16px;
          height: 16px;
          fill: none;
          stroke: #0d0d1a;
          stroke-width: 2.2;
          stroke-linecap: round;
          stroke-linejoin: round;
          transform: translateX(1px);
        }

        .camera-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.92);
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .camera-box {
          width: min(94vw, 500px);
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .camera-video {
          width: 100%;
          max-height: 70vh;
          object-fit: cover;
          border-radius: 18px;
          background: #000;
        }

        .camera-top {
          position: absolute;
          top: 15px;
          left: 15px;
          right: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 2;
        }

        .camera-close {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: rgba(0,0,0,0.6);
          color: white;
          font-size: 22px;
          cursor: pointer;
        }
          .camera-flip {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(0,0,0,0.6);
  color: white;
  font-size: 20px;
  cursor: pointer;
  margin-left: auto;
  margin-right: 8px;
}

.camera-flip:hover {
  background: rgba(255,255,255,0.2);
}

.camera-flip:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

        .recording-counter {
          background: #ef4444;
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .camera-controls {
          display: flex;
          gap: 25px;
          margin-top: 20px;
          align-items: center;
        }

        .camera-control {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          border: 3px solid white;
          background: transparent;
          cursor: pointer;
          color: white;
          font-size: 23px;
        }

        .camera-control.recording {
          background: #ef4444;
          border-color: #ef4444;
        }

        .camera-mode {
          display: flex;
          gap: 20px;
          margin-top: 12px;
        }

        .camera-mode button {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 13px;
        }

        .camera-mode button.active {
          color: white;
          font-weight: 600;
        }

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
    padding: 10px 8px;
  }

  .input-area {
    padding: 7px 6px;
    gap: 3px;
    width: 100%;
  }

  .media-btn {
    width: 34px;
    height: 34px;
    min-width: 34px;
    font-size: 16px;
  }

  .input-wrap {
    min-width: 0;
    width: auto;
  }

  .chat-input {
    font-size: 16px;
    min-width: 0;
    padding: 8px 0;
  }

  .send-btn {
    width: 36px;
    height: 36px;
    min-width: 36px;
  }

  .send-btn svg {
    width: 15px;
    height: 15px;
  }

  .camera-box {
    width: 94vw;
  }

  .chat-status-screen {
    min-height: 85vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    font-family: 'Inter', sans-serif;
  }

  .status-card {
    background: #1a1a2e;
    border: 1px solid #2d2d52;
    border-radius: 18px;
    padding: 36px 28px;
    max-width: 440px;
    width: 100%;
    text-align: center;
    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.45);
    animation: fadeUp 0.25s ease-out;
  }

  .status-spinner {
    width: 42px;
    height: 42px;
    border: 3px solid rgba(167, 139, 250, 0.2);
    border-top-color: #a78bfa;
    border-radius: 50%;
    margin: 0 auto;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .status-btn {
    padding: 10px 18px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;
  }

  .status-btn.primary {
    background: #6366f1;
    color: white;
  }

  .status-btn.primary:hover {
    background: #4f46e5;
  }

  .status-btn.secondary {
    background: #2d2d52;
    color: #e2e8f0;
  }

  .status-btn.secondary:hover {
    background: #3d3d6e;
  }
}
      `}</style>

      {chatAccess === "loading" && (
        <div
          style={{
            minHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#0f0f1b",
            color: "#94a3b8",
            fontSize: "16px",
            fontFamily: "'Inter', sans-serif",
            gap: "14px",
          }}
        >
          <div
            className="status-spinner"
            style={{ width: "30px", height: "30px", borderWidth: "2.5px" }}
          />
          <span>Just a second...</span>
        </div>
      )}

      {chatAccess === "full" && (
        <div className="chat-status-screen">
          <div className="status-card">
            <div style={{ fontSize: "52px", marginBottom: "16px" }}>🤖</div>
            <h2 style={{ color: "#f87171", margin: "0 0 12px", fontSize: "22px", fontWeight: "700" }}>
              Bot 🤖 AI Assistant
            </h2>
            <p style={{ color: "#cbd5e1", fontSize: "15px", lineHeight: 1.6, margin: "0 0 24px" }}>
              Bot 🤖 AI Assistant is temporarily unavailable. Please try again later.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => { window.location.href = "/"; }}
                className="status-btn secondary"
              >
                Back to Home
              </button>
              <button
                onClick={() => {
                  setChatAccess("loading");
                  socket.connect();
                }}
                className="status-btn primary"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {chatAccess === "error" && (
        <div className="chat-status-screen">
          <div className="status-card">
            <div style={{ fontSize: "52px", marginBottom: "16px" }}>⚠️</div>
            <h2 style={{ color: "#f87171", margin: "0 0 12px", fontSize: "22px", fontWeight: "700" }}>
              Connection Error
            </h2>
            <p style={{ color: "#cbd5e1", fontSize: "14px", lineHeight: 1.6, margin: "0 0 24px" }}>
              Unable to connect to the chat server right now.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => { window.location.href = "/"; }}
                className="status-btn secondary"
              >
                Back to Home
              </button>
              <button
                onClick={() => {
                  setChatAccess("loading");
                  socket.connect();
                }}
                className="status-btn primary"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {chatAccess === "allowed" && (
        <>
          <div
          className="chat-root"
          onContextMenu={(e) => {
            // Prevent context menu in chat.
            e.preventDefault();
          }}
        >
        <div className="chat-header">
          <div>
            <div className="header-title">SmartyHood ChatBot</div>

            <div className="header-sub">neet-general</div>

            <div
              style={{
                color: "#34d399",
                fontSize: "12px",
                marginTop: "4px",
                fontWeight: "600",
              }}
            >
              🟢 {onlineUsers} Users Online
            </div>
          </div>
<div className="users-panel">
  {publicUsers
    .filter((user) => user.socketId !== myId)
    .map((user) => (
      <div className="user-row" key={user.userId}>
        <span>
          🟢 User {user.userNumber}
        </span>

        <button
          onClick={() => {
    socket.emit("call_user", {
      targetUserId: user.userId,
    });
  }}
        >
          📞 Call
        </button>
      </div>
    ))}
</div>
          <div className="conn-pill">
            <div
              className="conn-dot"
              style={{
                background: connected ? "#34d399" : "#f87171",
              }}
            />

            {connected ? "Connected" : "Offline"}
          </div>
        </div>

        <div className="messages-area" ref={messagesRef}>
          <div className="date-divider">
            <span>Today</span>
          </div>

          {chat.length === 0 ? (
            <div className="empty-state">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2d2d52"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>

              <p>No messages yet. Say something!</p>
            </div>
          ) : (
            chat.map((msg) => (
              <Message
                key={msg.id}
                msg={msg}
                isOwn={msg.sender === myId}
                onDelete={deleteMessage}
              />
            ))
          )}

          {typing && <TypingIndicator />}

          <div ref={bottomRef} />
        </div>

        <div className="input-area">
          {/* Camera */}
          <button
            className="media-btn"
            onClick={openCamera}
            aria-label="Open camera"
            title="Camera"
          >
            📷
          </button>

          {/* Gallery */}
          <button
            className="media-btn"
            onClick={openGallery}
            aria-label="Open gallery"
            title="Gallery"
          >
            🖼️
          </button>

          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleGallerySelect}
            style={{ display: "none" }}
          />

          {/* Emoji */}
          <div
            ref={emojiPickerRef}
            style={{
              position: "relative",
            }}
          >
            <button
              onClick={() =>
                setShowEmojiPicker(!showEmojiPicker)
              }
              style={{
                background: "transparent",
                border: "none",
                fontSize: "22px",
                cursor: "pointer",
                color: "white",
              }}
            >
              😊
            </button>

            {showEmojiPicker && (
              <div
                style={{
                  position: "absolute",
                  bottom: "50px",
                  left: 0,
                  zIndex: 1000,
                }}
              >
                <EmojiPicker
                  onEmojiClick={onEmojiClick}
                  theme="dark"
                />
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

                e.target.style.height =
                  Math.min(e.target.scrollHeight, 120) + "px";
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
              <line
                x1="22"
                y1="2"
                x2="11"
                y2="13"
              />

              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>

      {/* CAMERA SCREEN */}

      {cameraOpen && (
        <div className="camera-overlay">
          <div className="camera-box">
<div className="camera-top">

  

  {recording && (
    <div className="recording-counter">
      🔴 {recordingSeconds}s / 30s
    </div>
  )}

</div>

            <video
              ref={cameraVideoRef}
              className="camera-video"
              autoPlay
              muted
              playsInline
            />

            <div className="camera-controls">
              {cameraMode === "photo" ? (
                <button
                  className="camera-control"
                  onClick={capturePhoto}
                  title="Take photo"
                >
                  📸
                </button>
              ) : recording ? (
                <button
                  className="camera-control recording"
                  onClick={stopVideoRecording}
                  title="Stop recording"
                >
                  ■
                </button>
              ) : (
                <button
                  className="camera-control"
                  onClick={startVideoRecording}
                  title="Record video"
                >
                  🎥
                </button>
              )}
            </div>

            <div className="camera-mode">
              <button
                className={cameraMode === "photo" ? "active" : ""}
                onClick={() => {
                  if (!recording) {
                    setCameraMode("photo");
                  }
                }}
              >
                PHOTO
              </button>

              <button
                className={cameraMode === "video" ? "active" : ""}
                onClick={() => {
                  if (!recording) {
                    setCameraMode("video");
                  }
                }}
              >
                VIDEO
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )}
    </>
  );
}