// =======================
// Globals
// =======================
let selectedElement = null;
let undoStack = [];
let redoStack = [];
const previewFrame = document.getElementById("previewFrame");

// Tool buttons
const textTool = document.getElementById("textTool");
const selectTool = document.getElementById("selectTool");
const colorTool = document.getElementById("colorTool");
const imageTool = document.getElementById("imageTool");
const buttonTool = document.getElementById("buttonTool");
const undoBtn = document.getElementById("undo");
const redoBtn = document.getElementById("redo");

// Panels
let colorPanel, imagePanel;

// =======================
// Helpers
// =======================
function saveState() {
  if (!previewFrame.contentDocument) return;
  undoStack.push(previewFrame.contentDocument.body.innerHTML);
  redoStack = [];
}

function restoreState(state) {
  if (!previewFrame.contentDocument) return;
  previewFrame.contentDocument.body.innerHTML = state;
  attachIframeListeners(previewFrame.contentDocument);
}

function undo() {
  if (undoStack.length === 0) return;
  const state = undoStack.pop();
  redoStack.push(previewFrame.contentDocument.body.innerHTML);
  restoreState(state);
}

function redo() {
  if (redoStack.length === 0) return;
  const state = redoStack.pop();
  undoStack.push(previewFrame.contentDocument.body.innerHTML);
  restoreState(state);
}

function clearSelection() {
  if (selectedElement) {
    selectedElement.style.outline = "";
    selectedElement = null;
  }
}

// =======================
// Tool Actions
// =======================
function addText() {
  const doc = previewFrame.contentDocument;
  const p = doc.createElement("p");
  p.textContent = "New Text";
  p.style.padding = "4px";
  doc.body.appendChild(p);
  saveState();
}

function addButton() {
  const doc = previewFrame.contentDocument;
  const btn = doc.createElement("button");
  btn.textContent = "Click Me";
  btn.style.padding = "6px 12px";
  btn.style.margin = "4px";
  doc.body.appendChild(btn);
  saveState();
}

function showColorPanel() {
  if (!colorPanel) {
    colorPanel = document.createElement("div");
    colorPanel.className = "onkaan-tool-panel";
    const input = document.createElement("input");
    input.type = "color";
    input.addEventListener("input", () => {
      if (selectedElement) {
        selectedElement.style.backgroundColor = input.value;
        saveState();
      }
    });
    colorPanel.appendChild(input);
    document.body.appendChild(colorPanel);
  }
  colorPanel.style.display = "block";
}

function showImagePanel() {
  if (!imagePanel) {
    imagePanel = document.createElement("div");
    imagePanel.className = "onkaan-tool-panel";
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Enter Image URL";
    const addBtn = document.createElement("button");
    addBtn.textContent = "Add";
    addBtn.addEventListener("click", () => {
      if (!input.value) return;
      const doc = previewFrame.contentDocument;
      const img = doc.createElement("img");
      img.src = input.value;
      img.style.maxWidth = "200px";
      img.style.display = "block";
      if (selectedElement && selectedElement.tagName === "IMG") {
        selectedElement.src = input.value; // replace
      } else {
        doc.body.appendChild(img); // add new
      }
      saveState();
    });
    imagePanel.appendChild(input);
    imagePanel.appendChild(addBtn);
    document.body.appendChild(imagePanel);
  }
  imagePanel.style.display = "block";
}

// =======================
// Iframe Listeners
// =======================
function attachIframeListeners(iframeDoc) {
  if (!iframeDoc) return;

  // Prevent duplicate
  if (iframeDoc._onkaanHandler) {
    iframeDoc.removeEventListener("click", iframeDoc._onkaanHandler, true);
  }

  iframeDoc._onkaanHandler = function (e) {
    // Prevent selecting tool panels
    if (e.target.closest(".onkaan-tool-panel")) return;

    e.preventDefault();
    e.stopPropagation();

    let target = e.target;
    while (
      target &&
      target !== iframeDoc &&
      (target.tagName === "HTML" || target.tagName === "BODY")
    ) {
      target = target.parentElement;
    }

    clearSelection();
    if (target && target !== iframeDoc && target !== iframeDoc.body) {
      selectedElement = target;
      selectedElement.style.outline = "2px solid #2196f3";
    }
  };

  iframeDoc.addEventListener("click", iframeDoc._onkaanHandler, true);
}

// =======================
// Init
// =======================
previewFrame.addEventListener("load", () => {
  const doc = previewFrame.contentDocument;
  if (!doc.body.innerHTML.trim()) {
    doc.body.innerHTML = "<p>Welcome! Add elements.</p>";
  }
  attachIframeListeners(doc);
  saveState();
});

// =======================
// Bind Events
// =======================
textTool.addEventListener("click", addText);
buttonTool.addEventListener("click", addButton);
colorTool.addEventListener("click", showColorPanel);
imageTool.addEventListener("click", showImagePanel);
undoBtn.addEventListener("click", undo);
redoBtn.addEventListener("click", redo);
