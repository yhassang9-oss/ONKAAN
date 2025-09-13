const previewFrame = document.getElementById("previewFrame");
const undoBtn = document.getElementById("undo");
const redoBtn = document.getElementById("redo");
const textTool = document.getElementById("textTool");
const colorTool = document.getElementById("color");
const imageTool = document.getElementById("image");
const buttonTool = document.getElementById("Buttons");
const selectTool = document.getElementById("selecttool");
const savePageBtn = document.getElementById("savePageBtn");

let selectedElement = null;
let history = [];
let historyIndex = -1;
let colorPanel = null;
let resizer = null;

// ✅ Save current iframe state
function saveHistory() {
  const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
  if (!iframeDoc) return;

  const content = iframeDoc.body.innerHTML;
  history = history.slice(0, historyIndex + 1);
  history.push(content);
  historyIndex++;

  localStorage.setItem("onkaan-history", JSON.stringify(history));
  localStorage.setItem("onkaan-historyIndex", historyIndex);
}

// ✅ Load history into iframe
function loadHistory(index) {
  const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
  if (!iframeDoc || index < 0 || index >= history.length) return;

  iframeDoc.body.innerHTML = history[index];
  historyIndex = index;
  selectedElement = null;
  attachIframeListeners(iframeDoc);
}

// ✅ Add resize handles
function enableResizing(el, iframeDoc) {
  disableResizing(); // remove old resizer
  resizer = iframeDoc.createElement("div");
  resizer.style.position = "absolute";
  resizer.style.width = "10px";
  resizer.style.height = "10px";
  resizer.style.background = "red";
  resizer.style.bottom = "0";
  resizer.style.right = "0";
  resizer.style.cursor = "se-resize";
  resizer.style.zIndex = "9999";
  resizer.style.userSelect = "none";

  el.style.position = "relative";
  el.appendChild(resizer);

  let isResizing = false;

  resizer.addEventListener("mousedown", (e) => {
    e.preventDefault();
    isResizing = true;
    iframeDoc.addEventListener("mousemove", resize);
    iframeDoc.addEventListener("mouseup", stopResize);
  });

  function resize(e) {
    if (!isResizing) return;
    el.style.width = e.clientX - el.getBoundingClientRect().left + "px";
    el.style.height = e.clientY - el.getBoundingClientRect().top + "px";
  }

  function stopResize() {
    isResizing = false;
    iframeDoc.removeEventListener("mousemove", resize);
    iframeDoc.removeEventListener("mouseup", stopResize);
    saveHistory();
  }
}

function disableResizing() {
  if (resizer && resizer.parentNode) {
    resizer.parentNode.removeChild(resizer);
  }
  resizer = null;
}

// ✅ Attach listeners inside iframe
function attachIframeListeners(iframeDoc) {
  iframeDoc.removeEventListener("_onkaanClick", iframeDoc._onkaanClick);

  iframeDoc._onkaanClick = function (e) {
    if (selectedElement) {
      selectedElement.style.outline = "";
      disableResizing();
    }
    selectedElement = e.target;
    selectedElement.style.outline = "2px solid blue";
    enableResizing(selectedElement, iframeDoc);
  };

  iframeDoc.addEventListener("click", iframeDoc._onkaanClick);
}

// ✅ On iframe load
previewFrame.addEventListener("load", () => {
  const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
  if (!iframeDoc) return;

  const savedHistory = JSON.parse(localStorage.getItem("onkaan-history") || "[]");
  const savedIndex = parseInt(localStorage.getItem("onkaan-historyIndex") || "-1", 10);

  if (savedHistory.length > 0 && savedIndex >= 0) {
    history = savedHistory;
    historyIndex = savedIndex;
    iframeDoc.body.innerHTML = history[historyIndex];
  } else {
    saveHistory();
  }

  selectedElement = null;
  attachIframeListeners(iframeDoc);
});

// ✅ Undo
undoBtn.addEventListener("click", () => {
  if (historyIndex > 0) loadHistory(historyIndex - 1);
});

// ✅ Redo
redoBtn.addEventListener("click", () => {
  if (historyIndex < history.length - 1) loadHistory(historyIndex + 1);
});

// ✅ Text Tool
textTool.addEventListener("click", () => {
  if (!selectedElement) return alert("Select an element first!");
  const newText = prompt("Enter new text:", selectedElement.innerText);
  if (newText !== null) {
    selectedElement.innerText = newText;
    saveHistory();
  }
});

// ✅ Color Tool (with OK button)
colorTool.addEventListener("click", () => {
  if (!selectedElement) return alert("Select an element first!");
  const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;

  if (colorPanel) {
    colorPanel.remove();
    colorPanel = null;
    return;
  }

  colorPanel = iframeDoc.createElement("div");
  colorPanel.style.position = "fixed";
  colorPanel.style.top = "10px";
  colorPanel.style.right = "10px";
  colorPanel.style.padding = "10px";
  colorPanel.style.background = "#fff";
  colorPanel.style.border = "1px solid #ccc";
  colorPanel.style.zIndex = "9999";

  const colorInput = iframeDoc.createElement("input");
  colorInput.type = "color";
  colorInput.value = "#000000";

  const okBtn = iframeDoc.createElement("button");
  okBtn.innerText = "OK";
  okBtn.style.marginLeft = "5px";
  okBtn.onclick = () => {
    selectedElement.style.color = colorInput.value;
    saveHistory();
    colorPanel.remove();
    colorPanel = null;
  };

  colorPanel.appendChild(colorInput);
  colorPanel.appendChild(okBtn);
  iframeDoc.body.appendChild(colorPanel);
});

// ✅ Image Tool (File Explorer)
imageTool.addEventListener("click", () => {
  if (!selectedElement || selectedElement.tagName !== "IMG") {
    return alert("Select an image element first!");
  }

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";

  fileInput.onchange = () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      selectedElement.src = e.target.result;
      saveHistory();
    };
    reader.readAsDataURL(file);
  };

  fileInput.click();
});

// ✅ Button Tool
buttonTool.addEventListener("click", () => {
  const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
  const newBtn = iframeDoc.createElement("button");
  newBtn.innerText = "New Button";
  newBtn.style.padding = "10px 15px";
  newBtn.style.margin = "5px";
  newBtn.style.background = "#007bff";
  newBtn.style.color = "#fff";
  newBtn.style.border = "none";
  newBtn.style.borderRadius = "5px";
  newBtn.style.cursor = "pointer";

  iframeDoc.body.appendChild(newBtn);
  saveHistory();
});

// ✅ Select Tool
selectTool.addEventListener("click", () => {
  if (selectedElement) {
    selectedElement.style.outline = "";
    disableResizing();
    selectedElement = null;
  }
});

// ✅ Save Page
savePageBtn.addEventListener("click", () => {
  const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
  const html = iframeDoc.documentElement.outerHTML;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "page.html";
  a.click();

  URL.revokeObjectURL(url);
});
