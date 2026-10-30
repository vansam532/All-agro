const form = document.querySelector("#chat-form");
const input = document.querySelector("#message-input");
const messages = document.querySelector("#messages");
const welcome = document.querySelector("#welcome");
const sendButton = document.querySelector("#send-button");
const pdfInput = document.querySelector("#pdf-input");
const pdfChip = document.querySelector("#pdf-chip");
const pdfName = document.querySelector("#pdf-name");
const statusText = document.querySelector("#status-text");
const sidebar = document.querySelector(".sidebar");

let history = [];
let attachedPdf = null;

function addMessage(role, text, extraClass = "") {
  welcome.classList.add("hidden");
  const row = document.createElement("div");
  row.className = `message ${role === "user" ? "user" : "assistant"} ${extraClass}`;
  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = role === "user" ? "YOU" : "V";
  const content = document.createElement("div");
  content.className = "message-content";
  const label = document.createElement("span");
  label.className = "message-label";
  label.textContent = role === "user" ? "YOU" : "VEDANT AI";
  const body = document.createElement("div");
  body.textContent = text;
  content.append(label, body);
  row.append(avatar, content);
  messages.append(row);
  row.scrollIntoView({ behavior: "smooth", block: "end" });
  return { row, body };
}

async function checkHealth() {
  try {
    const r = await fetch("/api/health");
    const data = await r.json();
    statusText.textContent = data.apiKeyConfigured ? "Ready to help" : "Add API key to start";
  } catch { statusText.textContent = "Server status unavailable"; }
}
checkHealth();

document.querySelectorAll(".suggestion").forEach(btn => btn.addEventListener("click", () => {
  input.value = btn.dataset.prompt || "";
  input.focus();
  input.dispatchEvent(new Event("input"));
}));

document.querySelector("#new-chat").addEventListener("click", () => {
  history = [];
  messages.replaceChildren();
  welcome.classList.remove("hidden");
  input.value = "";
  attachedPdf = null;
  pdfChip.hidden = true;
  sidebar.classList.remove("open");
});

document.querySelector("#menu-toggle").addEventListener("click", () => sidebar.classList.toggle("open"));

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
});

pdfInput.addEventListener("change", async () => {
  const file = pdfInput.files?.[0];
  if (!file) return;
  if (file.size > 8 * 1024 * 1024) {
    addMessage("assistant", "PDF must be 8 MB or smaller.");
    pdfInput.value = "";
    return;
  }
  pdfName.textContent = `Reading ${file.name}…`;
  pdfChip.hidden = false;
  const data = new FormData();
  data.append("pdf", file);
  try {
    const response = await fetch("/api/pdf", { method: "POST", body: data });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "PDF upload failed.");
    attachedPdf = result;
    pdfName.textContent = `${result.filename} · ready`;
    input.placeholder = "Ask a question about this PDF…";
  } catch (e) {
    attachedPdf = null;
    pdfName.textContent = e.message;
  }
  pdfInput.value = "";
});

document.querySelector("#remove-pdf").addEventListener("click", () => {
  attachedPdf = null;
  pdfChip.hidden = true;
  input.placeholder = "Message VEDANT AI… / अपना सवाल लिखें";
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  const message = input.value.trim();
  if (!message) return;
  const visibleMessage = attachedPdf ? `${message}\n\n[PDF: ${attachedPdf.filename}]` : message;
  addMessage("user", visibleMessage);
  input.value = "";
  input.style.height = "auto";
  sendButton.disabled = true;
  const pending = addMessage("assistant", "Thinking…");
  pending.body.className = "typing";
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        history,
        documentText: attachedPdf?.text || ""
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Something went wrong.");
    pending.body.className = "";
    pending.body.textContent = result.reply;
    history.push({ role: "user", text: message });
    history.push({ role: "model", text: result.reply });
    history = history.slice(-12);
    if (attachedPdf) {
      attachedPdf = null;
      pdfChip.hidden = true;
      input.placeholder = "Message VEDANT AI… / अपना सवाल लिखें";
    }
  } catch (e) {
    pending.body.className = "error";
    pending.body.textContent = e.message;
  } finally {
    sendButton.disabled = false;
    input.focus();
  }
});
