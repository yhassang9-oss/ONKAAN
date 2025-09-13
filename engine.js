// --- TOOL REFERENCES ---
const textTool = document.getElementById("textTool");
const selectTool = document.getElementById("selecttool");
const undoBtn = document.getElementById("undo");
const redoBtn = document.getElementById("redo");
const colorTool = document.getElementById("color");
const imageTool = document.getElementById("image");
const buttonTool = document.getElementById("Buttons");
const saveBtn = document.getElementById("savePageBtn");

const previewFrame = document.getElementById("previewFrame");

// --- STATE ---
let activeTool = null;
let selectedElement = null;
let colorPanel = null;
let historyStack = [];
let historyIndex = -1;

// --- HELPERS ---
function getEditorDocument() {
    return previewFrame.contentDocument || previewFrame.contentWindow.document;
}

function getEditorContainer() {
    return getEditorDocument().getElementById("editor-area");
}

// --- TOOL TOGGLE ---
function deactivateAllTools() {
    activeTool = null;
    textTool?.classList.remove("active-tool");
    selectTool?.classList.remove("active-tool");

    if (selectedElement) selectedElement.style.outline = "none";
    selectedElement = null;

    if (colorPanel) { colorPanel.remove(); colorPanel = null; }
}

textTool?.addEventListener("click", () => {
    if (activeTool === "text") deactivateAllTools();
    else { deactivateAllTools(); activeTool = "text"; textTool.classList.add("active-tool"); }
});

selectTool?.addEventListener("click", () => {
    if (activeTool === "select") deactivateAllTools();
    else { deactivateAllTools(); activeTool = "select"; selectTool.classList.add("active-tool"); }
});

// --- HISTORY ---
function saveHistory() {
    const container = getEditorContainer();
    if (!container) return;
    historyStack = historyStack.slice(0, historyIndex + 1);
    historyStack.push(container.innerHTML);
    historyIndex++;
    localStorage.setItem("onkaan-history", JSON.stringify(historyStack));
    localStorage.setItem("onkaan-historyIndex", historyIndex);
}

function undo() {
    if (historyIndex <= 0) return;
    historyIndex--;
    const container = getEditorContainer();
    container.innerHTML = historyStack[historyIndex];
    initEditorEvents();
}

function redo() {
    if (historyIndex >= historyStack.length - 1) return;
    historyIndex++;
    const container = getEditorContainer();
    container.innerHTML = historyStack[historyIndex];
    initEditorEvents();
}

undoBtn?.addEventListener("click", undo);
redoBtn?.addEventListener("click", redo);
document.addEventListener("keydown", e => {
    if (e.ctrlKey && e.key === "z") { e.preventDefault(); undo(); }
    if (e.ctrlKey && e.key === "y") { e.preventDefault(); redo(); }
});

// --- COLOR TOOL ---
colorTool?.addEventListener("click", () => {
    if (!selectedElement) return alert("Select an element first!");
    if (colorPanel) { colorPanel.remove(); colorPanel = null; return; }

    colorPanel = document.createElement("div");
    colorPanel.style.position = "fixed";
    colorPanel.style.top = "20px";
    colorPanel.style.left = "20px";
    colorPanel.style.padding = "10px";
    colorPanel.style.background = "#fff";
    colorPanel.style.border = "1px solid #ccc";
    colorPanel.style.zIndex = "9999";

    const input = document.createElement("input");
    input.type = "color";
    input.value = "#000000";

    const okBtn = document.createElement("button");
    okBtn.textContent = "OK";
    okBtn.style.marginLeft = "10px";

    colorPanel.appendChild(input);
    colorPanel.appendChild(okBtn);
    document.body.appendChild(colorPanel);

    input.addEventListener("input", e => {
        const color = e.target.value;
        const tag = selectedElement.tagName;
        if (selectedElement.isContentEditable || ["P","H1","H2","H3","H4","H5","H6","SPAN","A","LABEL"].includes(tag)) {
            selectedElement.style.color = color;
        } else if (["DIV","SECTION","FOOTER","HEADER"].includes(tag) || selectedElement.classList.contains("product-box")) {
            selectedElement.style.backgroundColor = color;
        } else if (tag === "IMG") {
            selectedElement.style.borderColor = color;
        }
    });

    okBtn.addEventListener("click", () => {
        saveHistory();
        colorPanel.remove();
        colorPanel = null;
    });
});

// --- IMAGE TOOL (File Explorer) ---
imageTool?.addEventListener("click", () => {
    if (!selectedElement || selectedElement.tagName !== "IMG") {
        alert("Select an image element first!");
        return;
    }

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);

    fileInput.click();

    fileInput.addEventListener("change", e => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(ev) {
            saveHistory();
            selectedElement.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    });

    document.body.removeChild(fileInput);
});

// --- ELEMENT SELECTION & TEXT TOOL ---
function initEditorEvents() {
    const editorDoc = getEditorDocument();
    editorDoc.addEventListener("click", e => {
        const target = e.target;
        if ([textTool, selectTool, colorTool, undoBtn, redoBtn, saveBtn, imageTool, buttonTool].includes(target)) return;

        if (activeTool === "select") {
            if (selectedElement) selectedElement.style.outline = "none";
            selectedElement = target;
            selectedElement.style.outline = "2px solid blue";
            makeResizable(selectedElement);
        } else if (activeTool === "text") {
            const newEl = editorDoc.createElement("p");
            newEl.textContent = "Edit me";
            newEl.contentEditable = "true";
            newEl.dataset.editable = "true";
            newEl.style.outline = "1px dashed gray";
            getEditorContainer().appendChild(newEl);
            saveHistory();
        }
    });
}

// --- RESIZING (Wrapper) ---
function removeHandles() {
    const editorDoc = getEditorDocument();
    editorDoc.querySelectorAll(".resize-handle").forEach(h => h.remove());
}

function makeResizable(el) {
    removeHandles();

    let wrapper = el.closest(".resizable-wrapper");
    if (!wrapper) {
        wrapper = getEditorDocument().createElement("div");
        wrapper.className = "resizable-wrapper";
        wrapper.style.display = "inline-block";
        wrapper.style.position = "relative";
        el.parentNode.insertBefore(wrapper, el);
        wrapper.appendChild(el);
    }

    const handle = getEditorDocument().createElement("div");
    handle.className = "resize-handle";
    handle.style.width = "12px";
    handle.style.height = "12px";
    handle.style.background = "red";
    handle.style.position = "absolute";
    handle.style.right = "0";
    handle.style.bottom = "0";
    handle.style.cursor = "se-resize";
    wrapper.appendChild(handle);

    let isResizing = false;
    handle.addEventListener("mousedown", e => {
        e.preventDefault(); e.stopPropagation();
        isResizing = true;
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = wrapper.offsetWidth;
        const startHeight = wrapper.offsetHeight;

        function resizeMove(ev) {
            if (!isResizing) return;
            wrapper.style.width = startWidth + (ev.clientX - startX) + "px";
            wrapper.style.height = startHeight + (ev.clientY - startY) + "px";
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

// --- SAVE PAGE ---
saveBtn?.addEventListener("click", () => {
    saveHistory();
    alert("Changes saved!");
});

// --- RESTORE HISTORY & INITIALIZE ---
window.addEventListener("load", () => {
    const savedHistory = JSON.parse(localStorage.getItem("onkaan-history") || "[]");
    const savedIndex = parseInt(localStorage.getItem("onkaan-historyIndex") || "-1");

    previewFrame.addEventListener("load", () => {
        if (savedHistory.length > 0 && savedIndex >= 0) {
            historyStack = savedHistory;
            historyIndex = savedIndex;
            getEditorContainer().innerHTML = historyStack[historyIndex];
        }
        initEditorEvents();
    });
});
