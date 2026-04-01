import { useState, useRef, useEffect } from "react";
import { API_URL } from "../config";
import { Send, Paperclip, Image, FileText, Mic, X, Check } from "lucide-react";
import "./PopupChatPanel.css";

export default function PopupChatPanel({ onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      text: "Hey there! I'm your compliance assistant. Ask me anything about SOC 2, AWS security, policies, or upload files for analysis.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const messagesEndRef = useRef(null);
  const imageInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const audioInputRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Enhanced clipboard paste handler for images with previews
  useEffect(() => {
    window.addEventListener("paste", (event) => {
      const items = event.clipboardData.items;

      for (let item of items) {
        if (item.type.indexOf("image") !== -1) {
          event.preventDefault();
          const file = item.getAsFile();
          const imageUrl = URL.createObjectURL(file);

          // Add to chat input
          addImageToChatInput({
            file,
            preview: imageUrl,
          });
        }
      }
    });
  }, []);

  const addImageToChatInput = ({ file, preview }) => {
    setAttachedFiles((prev) => [
      ...prev,
      { file, type: "image", name: file.name || "Pasted Image.png", preview },
    ]);
  };

  // Drag & drop handler
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add("drag-active");
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove("drag-active");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-active");

    const files = Array.from(e.dataTransfer.files);
    files.forEach((file) => {
      let type = "document";
      if (file.type.startsWith("image/")) type = "image";
      else if (file.type.startsWith("audio/")) type = "audio";

      setAttachedFiles((prev) => [...prev, { file, type, name: file.name }]);
    });
  };

  const handleFileAttach = (event, fileType) => {
    const files = Array.from(event.target.files);
    files.forEach((file) => {
      setAttachedFiles((prev) => [...prev, { file, type: fileType, name: file.name }]);
    });
  };

  const removeAttachedFile = (index) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() && attachedFiles.length === 0) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      type: "user",
      text: input || (attachedFiles.length > 0 ? `📎 Uploaded ${attachedFiles.length} file(s)` : ""),
      timestamp: new Date(),
      files: attachedFiles.length > 0 ? attachedFiles.map((f) => `${f.type}: ${f.name}`) : [],
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("message", input || "Please analyze these files:");
      
      attachedFiles.forEach((fileObj, idx) => {
        formData.append(`file_${idx}`, fileObj.file);
        formData.append(`file_type_${idx}`, fileObj.type);
      });
      formData.append("fileCount", attachedFiles.length);

      const response = await fetch(`${API_URL}/api/pramanik/chat`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      const botMessage = {
        id: messages.length + 2,
        type: "bot",
        text: data.response || "I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setAttachedFiles([]);
    } catch (error) {
      const errorMessage = {
        id: messages.length + 2,
        type: "bot",
        text: `Error: ${error.message}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setLoading(false);
  };

  return (
    <div className="popup-chat-panel">
      {/* Header */}
      <div className="popup-header">
        <div className="popup-header-content">
          <div className="popup-avatar">🤖</div>
          <div className="popup-header-text">
            <h3 className="popup-title">Compliance AI</h3>
            <p className="popup-status">{loading ? "Thinking..." : "Online"}</p>
          </div>
        </div>
        <button className="popup-close-btn" onClick={onClose} title="Close">
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div
        className="popup-messages"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {messages.map((msg) => (
          <div key={msg.id} className={`popup-message popup-message-${msg.type}`}>
            <div className="popup-message-avatar">
              {msg.type === "bot" ? "🤖" : "👤"}
            </div>
            <div className="popup-message-content">
              <p className="popup-message-text">{msg.text}</p>
              {msg.files && msg.files.length > 0 && (
                <div className="popup-message-files">
                  {msg.files.map((file, idx) => (
                    <span key={idx} className="popup-file-tag">
                      📎 {file}
                    </span>
                  ))}
                </div>
              )}
              <span className="popup-message-time">
                {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        ))}
        {loading && (
          <div className="popup-message popup-message-bot">
            <div className="popup-message-avatar">🤖</div>
            <div className="popup-message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attached Files Preview */}
      {attachedFiles.length > 0 && (
        <div className="popup-attachments">
          <div className="popup-attachments-label">📎 Files to send:</div>
          <div className="popup-attachments-list">
            {attachedFiles.map((file, idx) => (
              <div key={idx} className="popup-attachment-card">
                {file.type === "image" && file.preview ? (
                  <img
                    src={file.preview}
                    alt="paste preview"
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "3px",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <span className="popup-attachment-icon">
                    {file.type === "image" && <Image size={14} />}
                    {file.type === "document" && <FileText size={14} />}
                    {file.type === "audio" && <Mic size={14} />}
                  </span>
                )}
                <span className="popup-attachment-name">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachedFile(idx)}
                  className="popup-attachment-remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <form className="popup-input-form" onSubmit={handleSendMessage}>
        <div className="popup-input-group">
          {/* File Upload Buttons */}
          <div className="popup-upload-buttons">
            <button
              type="button"
              title="Upload Image (or Ctrl+V to paste)"
              onClick={() => imageInputRef.current?.click()}
              className="popup-upload-btn"
            >
              <Image size={16} />
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={(e) => handleFileAttach(e, "image")}
            />

            <button
              type="button"
              title="Upload Document"
              onClick={() => documentInputRef.current?.click()}
              className="popup-upload-btn"
            >
              <FileText size={16} />
            </button>
            <input
              ref={documentInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.doc"
              multiple
              style={{ display: "none" }}
              onChange={(e) => handleFileAttach(e, "document")}
            />

            <button
              type="button"
              title="Upload Audio"
              onClick={() => audioInputRef.current?.click()}
              className="popup-upload-btn"
            >
              <Mic size={16} />
            </button>
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              multiple
              style={{ display: "none" }}
              onChange={(e) => handleFileAttach(e, "audio")}
            />
          </div>

          {/* Text Input */}
          <input
            type="text"
            className="popup-input"
            placeholder="Ask anything... (Ctrl+V for images)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />

          {/* Send Button */}
          <button
            type="submit"
            className="popup-send-btn"
            disabled={loading || (!input.trim() && attachedFiles.length === 0)}
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
