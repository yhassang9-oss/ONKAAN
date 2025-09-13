// engine.js - Website editor (no resizing) with working tools based on your button IDs

const previewFrame = document.getElementById("previewFrame");
const undoBtn = document.getElementById("undo");
const redoBtn = document.getElementById("redo");
const textToolBtn = document.getElementById("textTool");
const colorToolBtn = document.getElementById("color");
const imageToolBtn = document.getElementById("image");
const buttonTool = document.getElementById("Buttons");
const selectTool = document.getElementById("selecttool");
const savePageBtn = document.getElementById("savePageBtn");

let selectedElement = null;
let history = [];
let historyIndex = -1;

// ------------------- HELPERS -------------------
function getIframeDoc() {
  try {
    return previewFrame.contentDocument || previewFrame.contentWindow.document;
  } catch (err) {
    console.warn("Cannot access iframe document:", err);
    return null;
  }
}

function getEditorContainer() {
  const doc = getIframeDoc();
  return doc ? (doc.getElementById("editor-area") || doc.body) : null;
}

// ------------------- HISTORY -------------------
function saveHistory() {
  const container = getEditorContainer();
  if (!container) return;
  history = history.slice(0, historyIndex + 1);
  history.push(container.innerHTML);
  historyIndex++;
  localStorage.setItem("onkaan-history", JSON.stringify(history));
  localStorage.setItem("onkaan-historyIndex", String(historyIndex));
}

function loadHistory(index) {
  const container = getEditorContainer();
  if (!container || index < 0 || index >= history.length) return;
  container.innerHTML = history[index];
  historyIndex = index;
  attachIframeListeners();
}

function restoreHistoryOnLoad() {
  try {
    const saved = JSON.parse(localStorage.getItem("onkaan-history") || "[]");
    const savedIndex = parseInt(localStorage.getItem("onkaan-historyIndex") || "-1", 10);
    if (Array.isArray(saved) && saved.length > 0 && savedIndex >= 0) {
      history = saved;
      historyIndex = savedIndex;
      const container = getEditorContainer();
      if (container) container.innerHTML = history[historyIndex];
      return true;
    }
  } catch {}
  return false;
}

// ------------------- SELECTION -------------------
function clearSelection() {
  if (selectedElement) selectedElement.style.outline = "";
  selectedElement = null;
}

function attachIframeListeners() {
  const doc = getIframeDoc();
  if (!doc) return;

  doc.body.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target === doc.body || e.target === doc.documentElement) return;

    clearSelection();
    selectedElement = e.target;
    selectedElement.style.outline = "2px solid #2196F3";
  }, true);
}

// ------------------- TOOLS -------------------

// Text tool - prompts user for new text
textToolBtn.addEventListener("click", () => {
  if (!selectedElement) return alert("Select an element first!");
  const newText = prompt("Enter new text:", selectedElement.textContent);
  if (newText !== null) {
    selectedElement.textContent = newText;
    saveHistory();
  }
});

// Color tool - prompts user for color
colorToolBtn.addEventListener("click", () => {
  if (!selectedElement) return alert("Select an element first!");
  const newColor = prompt("Enter color (name or hex):", selectedElement.style.color || "#000000");
  if (newColor) {
    selectedElement.style.color = newColor;
    saveHistory();
  }
});

// Image tool - prompts for image URL
imageToolBtn.addEventListener("click", () => {
  if (!selectedElement) return alert("Select an image first!");
  if (selectedElement.tagName !== "IMG") return alert("Selected element is not an image!");
  const imgUrl = prompt("Enter image URL:", selectedElement.src);
  if (imgUrl) {
    selectedElement.src = imgUrl;
    saveHistory();
  }
});

// Button tool - adds a new button
buttonTool.addEventListener("click", () => {
  const doc = getIframeDoc();
  if (!doc) return;
  const btn = doc.createElement("button");
  btn.textContent = "Click Me";
  btn.style.padding = "8px 16px";
  btn.style.margin = "5px";
  btn.style.cursor = "pointer";
  getEditorContainer().appendChild(btn);
  saveHistory();
});

// Undo/Redo
undoBtn.addEventListener("click", () => {
  if (historyIndex > 0) loadHistory(historyIndex - 1);
});
redoBtn.addEventListener("click", () => {
  if (historyIndex < history.length - 1) loadHistory(historyIndex + 1);
});

// Save page
savePageBtn.addEventListener("click", () => {
  const container = getEditorContainer();
  if (!container) return;
  const content = container.innerHTML;
  const blob = new Blob([content], { type: "text/html" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "page.html";
  link.click();
});

// ------------------- INIT -------------------
function initializeIframe() {
  const doc = getIframeDoc();
  if (!doc || doc.readyState !== "complete") { setTimeout(initializeIframe, 100); return; }
  if (!restoreHistoryOnLoad()) saveHistory();
  attachIframeListeners();
  clearSelection();
}

previewFrame.addEventListener("load", initializeIframe);

if (getIframeDoc()?.readyState === "complete") initializeIframe();
