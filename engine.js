const previewFrame = document.getElementById("previewFrame");
const undoBtn = document.getElementById("undo");
const redoBtn = document.getElementById("redo");
const textTool = document.getElementById("textTool");
const selectTool = document.getElementById("selecttool");
const colorTool = document.getElementById("color");
const imageTool = document.getElementById("image");
const buttonTool = document.getElementById("Buttons");
const savePageBtn = document.getElementById("savePageBtn");

let history = [];
let historyStep = -1;

// Save state for undo/redo
function saveState() {
  const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
  history = history.slice(0, historyStep + 1);
  history.push(doc.body.innerHTML);
  historyStep++;
}

// Load saved state
function loadState(step) {
  const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
  doc.body.innerHTML = history[step];
}

// Initialize once iframe is ready
previewFrame.addEventListener("load", () => {
  saveState();
});

// Undo
undoBtn.addEventListener("click", () => {
  if (historyStep > 0) {
    historyStep--;
    loadState(historyStep);
  }
});

// Redo
redoBtn.addEventListener("click", () => {
  if (historyStep < history.length - 1) {
    historyStep++;
    loadState(historyStep);
  }
});

// Text Tool
textTool.addEventListener("click", () => {
  const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
  const text = prompt("Enter text:");
  if (text) {
    const p = doc.createElement("p");
    p.textContent = text;
    doc.body.appendChild(p);
    saveState();
  }
});

// Select Tool
selectTool.addEventListener("click", () => {
  const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
  const elements = doc.querySelectorAll("*");
  elements.forEach(el => {
    el.contentEditable = true;
  });
  alert("Select tool activated. You can now edit text directly.");
});

// Color Tool
colorTool.addEventListener("click", () => {
  const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
  const color = prompt("Enter a color (name or hex):");
  if (color) {
    const selection = doc.getSelection();
    if (selection.rangeCount > 0) {
      const span = doc.createElement("span");
      span.style.color = color;
      selection.getRangeAt(0).surroundContents(span);
      saveState();
    }
  }
});

// Image Tool
imageTool.addEventListener("click", () => {
  const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
  const url = prompt("Enter image URL:");
  if (url) {
    const img = doc.createElement("img");
    img.src = url;
    doc.body.appendChild(img);
    saveState();
  }
});

// Buttons Tool
buttonTool.addEventListener("click", () => {
  const panel = document.getElementById("buttonDesignPanel");
  panel.style.display = panel.style.display === "none" ? "block" : "none";
});

// Save Page
savePageBtn.addEventListener("click", () => {
  const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
  const blob = new Blob([doc.documentElement.outerHTML], { type: "text/html" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "page.html";
  a.click();
  URL.revokeObjectURL(a.href);
});
