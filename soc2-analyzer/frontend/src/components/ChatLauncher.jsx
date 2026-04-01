import { useState, useEffect } from "react";
import { X, Bot, Sparkles } from "lucide-react";
import PopupChatPanel from "./PopupChatPanel";
import "./ChatLauncher.css";

export default function ChatLauncher() {
  const [isOpen, setIsOpen]   = useState(false);
  const [hasNew, setHasNew]   = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* ── Floating Button ── */}
      <div className="chat-launcher-wrap">

        {/* Tooltip pill — slides in on hover */}
        <div className={`chat-tooltip ${hovered && !isOpen ? "chat-tooltip--visible" : ""}`}>
          <Sparkles size={11} />
          Ask Pramanik AI
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={`chat-launcher-btn ${isOpen ? "chat-launcher-btn--open" : ""}`}
          aria-label="Open compliance chat"
        >
          {/* Glow rings */}
          <span className="chat-ring chat-ring-1" />
          <span className="chat-ring chat-ring-2" />

          {/* Icon */}
          <span className="chat-icon-wrap">
            {isOpen
              ? <X size={20} strokeWidth={2.5} />
              : <Bot size={22} strokeWidth={1.8} />
            }
          </span>

          {/* Live dot */}
          {!isOpen && <span className="chat-live-dot" />}

          {/* Notification badge */}
          {hasNew && !isOpen && <span className="chat-notification-dot" />}
        </button>
      </div>

      {/* ── Popup Panel ── */}
      {isOpen && (
        <div className="chat-popup-overlay" onClick={() => setIsOpen(false)}>
          <div className="chat-popup-container" onClick={(e) => e.stopPropagation()}>
            <PopupChatPanel onClose={() => setIsOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
