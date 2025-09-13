// =========================
// ONKAAN ENGINE.JS (FULL, MATCHED TO YOUR HTML)
// =========================

// Grab toolbar buttons
const previewFrame = document.getElementById("previewFrame");
const undoBtn = document.getElementById("undo");
const redoBtn = document.getElementById("redo");
const textTool = document.getElementById("textTool");
const colorTool = document.getElementById("color");
const imageTool = document.getElementById("image");
const buttonTool = document.getElementById("Buttons"); // ✅ fixed: matches your HTML
const selectTool = document.getElementById("selecttool");
const saveBtn = document.getElementById("savePageBtn");

let selectedElement = null;
let history = [];
let historyIndex = -1;

// =========================
// History System
// =========================
function saveHistory() {
  const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
  if (!iframeDoc) return;

  history = history.slice(0, historyIndex + 1);
  history.push(iframeDoc.body.innerHTML);
  historyIndex++;
}

function loadHistory(index) {
  const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
  if (!iframeDoc || index < 0 || index >= history.length) return;

  iframeDoc.body.innerHTML = history[index];
  historyIndex = index;
  selectedElement = null;
  attachIframeListeners(iframeDoc);
}

// =========================
// Selection System
// =========================
function attachIframeListeners(iframeDoc) {
  iframeDoc.body.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (selectedElement) {
      selectedElement.style.outline = "";
    }

    selectedElement = e.target;
    selectedElement.style.outline = "2px solid red";
  });
}

// =========================
// On iframe load
// =========================
previewFrame.addEventListener("load", () => {
  const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
  if (!iframeDoc) return;

  saveHistory();
  attachIframeListeners(iframeDoc);
});

// =========================
// Undo / Redo
// =========================
undoBtn.addEventListener("click", () => {
  if (historyIndex > 0) {
    loadHistory(historyIndex - 1);
  }
});

redoBtn.addEventListener("click", () => {
  if (historyIndex < history.length - 1) {
    loadHistory(historyIndex + 1);
  }
});

// =========================
// Tools
// =========================

// Text Tool
textTool.addEventListener("click", () => {
  if (!selectedElement) return alert("Select an element first!");
  const newText = prompt("Enter new text:", selectedElement.innerText);
  if (newText !== null) {
    selectedElement.innerText = newText;
    saveHistory();
  }
});

// Color Tool
colorTool.addEventListener("click", () => {
  if (!selectedElement) return alert("Select an element first!");
  const newColor = prompt("Enter color (e.g. red, #ff0000):", "#000000");
  if (newColor) {
    selectedElement.style.color = newColor;
    saveHistory();
  }
});

// Image Tool
imageTool.addEventListener("click", () => {
  if (!selectedElement || selectedElement.tagName !== "IMG") {
    return alert("Select an image first!");
  }
  const newSrc = prompt("Enter new image URL:", selectedElement.src);
  if (newSrc) {
    selectedElement.src = newSrc;
    saveHistory();
  }
});

// Button Tool
buttonTool.addEventListener("click", () => {
  const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
  const newBtn = iframeDoc.createElement("button");
  newBtn.innerText = "New Button";
  newBtn.style.padding = "8px 12px";
  newBtn.style.margin = "5px";
  newBtn.style.background = "#007bff";
  newBtn.style.color = "#fff";
  newBtn.style.border = "none";
  newBtn.style.borderRadius = "4px";
  newBtn.style.cursor = "pointer";

  iframeDoc.body.appendChild(newBtn);
  saveHistory();

  newBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectedElement) selectedElement.style.outline = "";
    selectedElement = newBtn;
    selectedElement.style.outline = "2px solid red";
  });
});

// Select Tool
selectTool.addEventListener("click", () => {
  if (selectedElement) {
    selectedElement.style.outline = "";
    selectedElement = null;
  }
});

// Save Page (just alerts for now)
saveBtn.addEventListener("click", () => {
  saveHistory();
  alert("Page saved!");
});
