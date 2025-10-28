// chatbot/chatbot.js
document.addEventListener("DOMContentLoaded", () => {
  const chatBtn = document.getElementById("chat-inline-icon");
  const chatPopup = document.getElementById("chat-popup");
  const chatSend = document.getElementById("chat-send");
  const chatInput = document.getElementById("chat-input");
  const chatBody = document.getElementById("chat-body");

  // Toggle popup open/close
  if (chatBtn && chatPopup) {
    chatBtn.addEventListener("click", () => {
      chatPopup.classList.toggle("active");
      chatPopup.style.display =
        chatPopup.style.display === "flex" ? "none" : "flex";
    });
  }

  // Send user message → get bot response
  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Show user message
    const userMsg = document.createElement("div");
    userMsg.className = "message user";
    userMsg.textContent = text;
    chatBody.appendChild(userMsg);
    chatInput.value = "";
    chatBody.scrollTop = chatBody.scrollHeight;

    // Temporary bot 'thinking...' text
    const botMsg = document.createElement("div");
    botMsg.className = "message bot";
    botMsg.textContent = "Thinking...";
    chatBody.appendChild(botMsg);
    chatBody.scrollTop = chatBody.scrollHeight;

    try {
      const res = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      const reply = data.reply || "Sorry, I couldn’t find that.";

      botMsg.textContent = reply;
      chatBody.scrollTop = chatBody.scrollHeight;

      // ✅ Enhanced search‑trigger logic
      const searchInput = document.getElementById("searchInput");
      const searchButton = document.getElementById("searchButton");

      if (searchInput && searchButton && reply) {
        // --- Smart keyword detection ---
        let query = "";

        // 1️⃣ Search for quoted text (e.g., “Despacito”)
        const quoted = reply.match(/["“”']([^"“”']+)["“”']/);
        if (quoted && quoted[1]) {
          query = quoted[1];
        } else {
          // 2️⃣ Fallback: take first full sentence
          query = reply.split(".")[0];
        }

        // 3️⃣ Clean any special formatting
        query = query.replace(/[\n\r]/g, " ").trim();

        // Fill into main MeTube search bar
        searchInput.value = query;

        // 4️⃣ Delay slightly before auto‑triggering search
        setTimeout(() => searchButton.click(), 800);
      }
    } catch (error) {
      console.error("Chatbot fetch error:", error);
      botMsg.textContent = "⚠️ Network error. Try again later.";
    }
  }

  // Event listeners
  chatSend.addEventListener("click", sendMessage);
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
});

// ✅ Enhanced search‑trigger logic
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");

// Only proceed if both exist
if (searchInput && searchButton && reply) {
  // Extract keyword from reply (quoted or first sentence)
  let query = "";
  const quoted = reply.match(/["“”']([^"“”']+)["“”']/);
  query = quoted && quoted[1] ? quoted[1] : reply.split(".")[0];
  query = query.replace(/[\n\r]/g, " ").trim();

  // Fill the main MeTube search box
  searchInput.value = query;

  // ✅ Option 1 — Call your main search function directly if defined
  if (typeof searchVideos === "function") {
    setTimeout(() => {
      searchVideos();
    }, 800);
  }
  // ✅ Option 2 — As a fallback, simulate button click
  else {
    setTimeout(() => {
      searchButton.click();
    }, 800);
  }
}
