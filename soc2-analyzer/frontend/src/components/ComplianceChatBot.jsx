import { useState, useRef, useEffect } from "react";
import { API_URL } from "../config";
import { Send, MessageCircle, Upload, Image, FileText, Mic } from "lucide-react";
import "./ComplianceChatBot.css";

const quickQuestions = [
  { icon: "🔐", text: "What is CC6.1 (Logical Access)?" },
  { icon: "☁️", text: "How do I enable CloudTrail?" },
  { icon: "🔑", text: "MFA best practices" },
  { icon: "📋", text: "Generate an Access Control Policy" },
  { icon: "🏢", text: "Vendor management checklist" },
  { icon: "🚨", text: "Incident response plan" },
  { icon: "⏰", text: "SOC 2 Type I vs Type II" },
  { icon: "📊", text: "How long is SOC 2 audit?" },
];

export default function ComplianceChatBot() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      text: "👋 Hi! I'm Pramanik AI, your SOC 2 compliance advisor. I can help with the 33 SOC 2 controls, AWS security, compliance policies, vendor assessments, audit prep, and more. Try uploading documents, images, or audio files!",
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Enhanced clipboard paste handler with image preview
  useEffect(() => {
    window.addEventListener("paste", (event) => {
      const items = event.clipboardData.items;

      for (let item of items) {
        if (item.type.indexOf("image") !== -1) {
          event.preventDefault();
          const file = item.getAsFile();
          const imageUrl = URL.createObjectURL(file);

          // Push to chat input preview
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
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append("message", input || "Please analyze these files:");
      
      // Add attached files
      attachedFiles.forEach((fileObj, idx) => {
        formData.append(`file_${idx}`, fileObj.file);
        formData.append(`file_type_${idx}`, fileObj.type);
      });
      formData.append("fileCount", attachedFiles.length);

      // Call backend chat endpoint with files
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
        text: `Error: ${error.message}. Make sure the backend is running on port 8000.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setLoading(false);
  };

  const handleQuickQuestion = (question) => {
    setInput(question);
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <div className="chatbot-wrapper">
        {/* Header */}
        <div className="chatbot-header" style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
          <div className="header-content">
            <div className="header-title-group">
              <MessageCircle className="header-icon" />
              <div>
                <h1 className="header-title">Compliance Assistant</h1>
                <p className="header-subtitle">Powered by Pramanik AI</p>
              </div>
            </div>
          </div>
          <div className="status-badge">
            <span className="status-dot"></span>
            <span>Ready</span>
          </div>
        </div>

        <div className="chatbot-container">
          {/* Messages */}
          <div className="messages-container">
            {messages.length === 1 && (
              <div className="welcome-section">
                <div className="welcome-icon">🤖</div>
                <h2 className="welcome-title">SOC 2 Compliance Expert</h2>
                <p className="welcome-text">
                  Ask me anything about the 33 SOC 2 controls, AWS security, compliance policies, audit preparation, and more.
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`message message-${msg.type}`}>
                <div className="message-avatar">
                  {msg.type === "bot" ? "🤖" : "👤"}
                </div>
                <div className="message-bubble">
                  <p className="message-text">{msg.text}</p>
                  <span className="message-time">
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="message message-bot">
                <div className="message-avatar">🤖</div>
                <div className="message-bubble">
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

          {/* Quick Questions - Show if early in conversation */}
          {messages.length <= 2 && (
            <div className="quick-section">
              <p className="quick-title">Popular Questions:</p>
              <div className="quick-grid">
                {quickQuestions.slice(0, 4).map((q, idx) => (
                  <button
                    key={idx}
                    className="quick-btn"
                    onClick={() => handleQuickQuestion(q.text)}
                    style={{ borderColor: "var(--border)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                  >
                    <span className="quick-icon">{q.icon}</span>
                    <span className="quick-text">{q.text}</span>
                  </button>
                ))}
              </div>
              <div className="quick-grid">
                {quickQuestions.slice(4, 8).map((q, idx) => (
                  <button
                    key={idx + 4}
                    className="quick-btn"
                    onClick={() => handleQuickQuestion(q.text)}
                    style={{ borderColor: "var(--border)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                  >
                    <span className="quick-icon">{q.icon}</span>
                    <span className="quick-text">{q.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form className="message-form" onSubmit={handleSendMessage}>
            {/* Attached Files Display */}
            {attachedFiles.length > 0 && (
              <div style={{ padding: "0.75rem 1.5rem", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
                <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "500" }}>
                  📎 Attached Files:
                </p>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                  {attachedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: "relative",
                        padding: "0.4rem 0.75rem",
                        background: "var(--bg-primary)",
                        borderRadius: "6px",
                        fontSize: "0.8rem",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      {file.type === "image" && file.preview && (
                        <img
                          src={file.preview}
                          alt="paste preview"
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "4px",
                            objectFit: "cover",
                          }}
                        />
                      )}
                      {file.type === "image" && !file.preview && <Image size={14} />}
                      {file.type === "document" && <FileText size={14} />}
                      {file.type === "audio" && <Mic size={14} />}
                      <span>{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachedFile(idx)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          padding: "0",
                          fontSize: "1rem",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input Controls */}
            <div className="input-group" style={{ borderTop: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
              {/* File Upload Buttons */}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  title="Upload Image"
                  onClick={() => imageInputRef.current?.click()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "36px",
                    height: "36px",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    background: "var(--bg-primary)",
                    color: "var(--accent)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseOver={(e) => (e.target.style.background = "var(--bg-secondary)")}
                  onMouseOut={(e) => (e.target.style.background = "var(--bg-primary)")}
                >
                  <Image size={18} />
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
                  title="Upload Document (PDF, DOCX, TXT)"
                  onClick={() => documentInputRef.current?.click()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "36px",
                    height: "36px",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    background: "var(--bg-primary)",
                    color: "var(--accent)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseOver={(e) => (e.target.style.background = "var(--bg-secondary)")}
                  onMouseOut={(e) => (e.target.style.background = "var(--bg-primary)")}
                >
                  <FileText size={18} />
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
                  title="Upload Audio (WAV, MP3, M4A)"
                  onClick={() => audioInputRef.current?.click()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "36px",
                    height: "36px",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    background: "var(--bg-primary)",
                    color: "var(--accent)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseOver={(e) => (e.target.style.background = "var(--bg-secondary)")}
                  onMouseOut={(e) => (e.target.style.background = "var(--bg-primary)")}
                >
                  <Mic size={18} />
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
                className="message-input"
                placeholder="Ask about SOC 2 or upload files (images, docs, audio)..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                style={{ background: "var(--bg-primary)", color: "var(--text-primary)", borderColor: "var(--border)" }}
              />

              {/* Send Button */}
              <button
                type="submit"
                className="send-btn"
                disabled={loading || (!input.trim() && attachedFiles.length === 0)}
                style={{
                  background:
                    loading || (!input.trim() && attachedFiles.length === 0)
                      ? "var(--text-muted)"
                      : "var(--accent)",
                }}
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
