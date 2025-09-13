// =========================
// ONKAAN ENGINE.JS (FULL, ENHANCED)
// =========================

// Grab toolbar buttons
const previewFrame = document.getElementById("previewFrame");
const undoBtn = document.getElementById("undo");
const redoBtn = document.getElementById("redo");
const textTool = document.getElementById("textTool");
const colorTool = document.getElementById("color");
const imageTool = document.getElementById("image");
const buttonTool = document.getElementById("Buttons"); // matches your HTML
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
      removeResizeHandle(selectedElement);
    }

    selectedElement = e.target;
    selectedElement.style.outline = "2px solid red";

    makeResizable(selectedElement, iframeDoc);
  });
}

// =========================
// Resizing System
// =========================
function makeResizable(element, iframeDoc) {
  removeResizeHandle(element);

  if (element.tagName === "BODY") return;

  const handle = iframeDoc.createElement("div");
  handle.className = "resize-handle";
  handle.style.width = "10px";
  handle.style.height = "10px";
  handle.style.background = "blue";
  handle.style.position = "absolute";
  handle.style.right = "0";
  handle.style.bottom = "0";
  handle.style.cursor = "se-resize";
  handle.style.zIndex = "9999";

  element.style.position = "relative";
  element.appendChild(handle);

  let isResizing = false;

  handle.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();

    isResizing = true;
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = element.offsetWidth;
    const startHeight = element.offsetHeight;

    function resizeMove(ev) {
      if (!isResizing) return;
      element.style.width = startWidth + (ev.clientX - startX) + "px";
      element.style.height = startHeight + (ev.clientY - startY) + "px";
    }

    function stopResize() {
      isResizing = false;
      document.removeEventListener("mousemove", resizeMove);
      document.removeEventListener("mouseup", stopResize);
      saveHistory();
    }

    document.addEventListener("mousemove", resizeMove);
    document.addEventListener("mouseup", stopResize);
  });
}

function removeResizeHandle(element) {
  if (!element) return;
  const handles = element.querySelectorAll(".resize-handle");
  handles.forEach((h) => h.remove());
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
  if (historyIndex > 0) loadHistory(historyIndex - 1);
});

redoBtn.addEventListener("click", () => {
  if (historyIndex < history.length - 1) loadHistory(historyIndex + 1);
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

// Color Tool (real color palette)
colorTool.addEventListener("click", () => {
  if (!selectedElement) return alert("Select an element first!");
  const colorInput = document.createElement("input");
  colorInput.type = "color";
  colorInput.style.position = "fixed";
  colorInput.style.top = "10px";
  colorInput.style.right = "10px";
  colorInput.style.zIndex = "99999";

  colorInput.addEventListener("input", (e) => {
    selectedElement.style.color = e.target.value;
  });

  colorInput.addEventListener("change", () => {
    saveHistory();
    colorInput.remove();
  });

  document.body.appendChild(colorInput);
  colorInput.click();
});

// Image Tool (open file explorer)
imageTool.addEventListener("click", () => {
  if (!selectedElement || selectedElement.tagName !== "IMG") {
    return alert("Select an image first!");
  }

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.style.display = "none";

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        selectedElement.src = ev.target.result; // Replace with uploaded image
        saveHistory();
      };
      reader.readAsDataURL(file);
    }
  });

  document.body.appendChild(fileInput);
  fileInput.click();
  fileInput.remove();
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
});

// Select Tool
selectTool.addEventListener("click", () => {
  if (selectedElement) {
    selectedElement.style.outline = "";
    removeResizeHandle(selectedElement);
    selectedElement = null;
  }
});

// Save Page (just alerts for now)
saveBtn.addEventListener("click", () => {
  saveHistory();
  alert("Page saved!");
});
