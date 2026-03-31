import { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import PopupChatPanel from "./PopupChatPanel";
import "./ChatLauncher.css";

export default function ChatLauncher() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Floating Launcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="chat-launcher-btn"
        title="Open Compliance Assistant"
        aria-label="Open chat"
      >
        {isOpen ? (
          <X size={20} />
        ) : (
          <>
            <MessageCircle size={20} />
            {hasNew && <span className="chat-notification-dot"></span>}
          </>
        )}
      </button>

      {/* Popup Chat Panel */}
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
