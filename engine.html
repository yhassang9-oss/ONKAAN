const textTool = document.getElementById("textTool");
const selectTool = document.getElementById("selecttool");
const undoBtn = document.getElementById("undo");
const redoBtn = document.getElementById("redo");
const colorTool = document.getElementById("color");
const imageTool = document.getElementById("image");
const buttonTool = document.getElementById("Buttons");
const previewFrame = document.getElementById("previewFrame");

let activeTool = null;
let selectedElement = null;
let historyStack = [];
let historyIndex = -1;
let colorPanel = null;
let buttonPanel = null;

// --- TOOL TOGGLE ---
function deactivateAllTools() {
  activeTool = null;
  textTool?.classList.remove("active-tool");
  selectTool?.classList.remove("active-tool");

  hideGridLines();
  removeHandles(previewFrame.contentDocument || previewFrame.contentWindow.document);

  if (selectedElement) selectedElement.style.outline = "none";
  selectedElement = null;

  if (colorPanel) { colorPanel.remove(); colorPanel = null; }
  if (buttonPanel) { buttonPanel.style.display = "none"; }
}

textTool?.addEventListener("click", () => {
  if (activeTool === "text") deactivateAllTools();
  else { deactivateAllTools(); activeTool = "text"; textTool.classList.add("active-tool"); }
});

selectTool?.addEventListener("click", () => {
  if (activeTool === "select") deactivateAllTools();
  else { deactivateAllTools(); activeTool = "select"; selectTool.classList.add("active-tool"); showGridLines(); }
});

// --- GRID LINES ---
function showGridLines() {
  const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
  if (!iframeDoc) return;
  iframeDoc.body.style.backgroundImage = `
    linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)
  `;
  iframeDoc.body.style.backgroundSize = "20px 20px";
}

function hideGridLines() {
  const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
  if (!iframeDoc) return;
  iframeDoc.body.style.backgroundImage = "none";
}

// --- HISTORY FUNCTIONS ---
function cleanHTMLForSave(container) {
  const tempHTML = container.cloneNode(true);
  tempHTML.querySelectorAll(".resize-handle").forEach(h => h.remove());
  tempHTML.querySelectorAll("*").forEach(el => el.style.outline = "none");
  return tempHTML.innerHTML;
}

function saveHistory() {
  const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
  const editorContainer = iframeDoc.getElementById("editor-area");
  if (!editorContainer) return;

  historyStack = historyStack.slice(0, historyIndex + 1);
  historyStack.push(cleanHTMLForSave(editorContainer));
  historyIndex++;

  localStorage.setItem("onkaan-history", JSON.stringify(historyStack));
  localStorage.setItem("onkaan-historyIndex", historyIndex);
}

function undo() {
  if (historyIndex > 0) {
    historyIndex--;
    const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
    const editorContainer = iframeDoc.getElementById("editor-area");
    if (editorContainer) editorContainer.innerHTML = historyStack[historyIndex];
    localStorage.setItem("onkaan-historyIndex", historyIndex);
  }
}

function redo() {
  if (historyIndex < historyStack.length - 1) {
    historyIndex++;
    const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
    const editorContainer = iframeDoc.getElementById("editor-area");
    if (editorContainer) editorContainer.innerHTML = historyStack[historyIndex];
    localStorage.setItem("onkaan-historyIndex", historyIndex);
  }
}

undoBtn?.addEventListener("click", undo);
redoBtn?.addEventListener("click", redo);

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "z") { e.preventDefault(); undo(); }
  else if (e.ctrlKey && e.key === "y") { e.preventDefault(); redo(); }
});

// --- COLOR TOOL (Smooth Version) ---
colorTool?.addEventListener("click", () => {
  if (!selectedElement) return alert("Select an element first!");
  if (colorPanel) { colorPanel.remove(); colorPanel = null; return; }

  colorPanel = document.createElement("input");
  colorPanel.type = "color";
  colorPanel.style.position = "fixed";
  colorPanel.style.top = "20px";
  colorPanel.style.left = "20px";
  colorPanel.style.zIndex = "9999";
  document.body.appendChild(colorPanel);

  // Use 'input' for real-time smooth update
  colorPanel.addEventListener("input", (e) => {
    if (!selectedElement) return;
    const tag = selectedElement.tagName;

    if (selectedElement.isContentEditable || ["P","H1","H2","H3","H4","H5","H6","SPAN","A","LABEL"].includes(tag)) {
      selectedElement.style.color = e.target.value;
    } else if (tag === "DIV" || tag === "SECTION" || tag === "FOOTER" || selectedElement.classList.contains("product-box")) {
      selectedElement.style.backgroundColor = e.target.value;
    } else if (tag === "IMG") {
      selectedElement.style.borderColor = e.target.value;
    }

    saveHistory(); // save each change
  });
});

// --- IFRAME LOGIC ---
previewFrame?.addEventListener("load", () => {
  const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
  const editorContainer = iframeDoc.getElementById("editor-area");
  if (!editorContainer) return;

  const savedHistory = JSON.parse(localStorage.getItem("onkaan-history") || "[]");
  const savedIndex = parseInt(localStorage.getItem("onkaan-historyIndex") || "-1", 10);

  if (savedHistory.length > 0 && savedIndex >= 0) {
    historyStack = savedHistory;
    historyIndex = savedIndex;
    editorContainer.innerHTML = historyStack[historyIndex];
  } else { saveHistory(); }

  iframeDoc.addEventListener("click", (e) => {
    const el = e.target;

    // --- TEXT TOOL ---
    if (activeTool === "text") {
      const newText = iframeDoc.createElement("div");
      newText.textContent = "Type here...";
      newText.contentEditable = "true";
      newText.dataset.editable = "true";
      newText.style.position = "absolute";
      newText.style.left = e.pageX + "px";
      newText.style.top = e.pageY + "px";
      newText.style.fontSize = "16px";
      newText.style.color = "black";
      newText.style.outline = "none";
      newText.style.cursor = "text";
      editorContainer.appendChild(newText);
      newText.focus();

      saveHistory();
      deactivateAllTools();
      return;
    }

    // --- SELECT TOOL ---
    if (activeTool === "select") {
      e.preventDefault();
      e.stopPropagation();
      if (selectedElement) removeHandles(iframeDoc);

      if ((el.dataset.editable === "true") || el.tagName === "BUTTON" || el.tagName === "IMG" ||
          el.classList.contains("slideshow-container") || el.tagName === "DIV" ||
          ["P","H1","H2","H3","H4","H5","H6","SPAN","A","LABEL"].includes(el.tagName)) {

        selectedElement = el;
        selectedElement.style.outline = "2px dashed red";
        makeResizable(selectedElement, iframeDoc);

        if (["P","H1","H2","H3","H4","H5","H6","SPAN","A","LABEL"].includes(el.tagName)) {
          selectedElement.contentEditable = "true";
          selectedElement.dataset.editable = "true";
          selectedElement.focus();
          selectedElement.addEventListener("blur", () => saveHistory(), { once: true });
        }

        // Remove outline immediately so it never gets saved
        setTimeout(() => { if(selectedElement) selectedElement.style.outline="none"; }, 100);
      }
    }
  });
});

// --- RESIZING ---
function removeHandles(doc) { doc.querySelectorAll(".resize-handle").forEach(h => h.remove()); }

function makeResizable(el, doc) {
  removeHandles(doc);
  const handle = doc.createElement("div");
  handle.className = "resize-handle";
  handle.style.width = "10px";
  handle.style.height = "10px";
  handle.style.background = "red";
  handle.style.position = "absolute";
  handle.style.right = "0";
  handle.style.bottom = "0";
  handle.style.cursor = "se-resize";
  handle.style.zIndex = "9999";

  el.style.position = "relative";
  el.appendChild(handle);

  let isResizing = false;

  handle.addEventListener("mousedown", (e) => {
    e.preventDefault(); e.stopPropagation();
    isResizing = true;
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = parseInt(getComputedStyle(el).width, 10);
    const startHeight = parseInt(getComputedStyle(el).height, 10);

    function resizeMove(ev) {
      if (!isResizing) return;
      el.style.width = startWidth + (ev.clientX - startX) + "px";
      el.style.height = startHeight + (ev.clientY - startY) + "px";
    }

    function stopResize() {
      if (isResizing) saveHistory();
      isResizing = false;
      doc.removeEventListener("mousemove", resizeMove);
      doc.removeEventListener("mouseup", stopResize);
    }

    doc.addEventListener("mousemove", resizeMove);
    doc.addEventListener("mouseup", stopResize);
  });
}
