// --- TOOL REFERENCES ---
const textTool = document.getElementById("textTool");
const selectTool = document.getElementById("selecttool");
const undoBtn = document.getElementById("undo");
const redoBtn = document.getElementById("redo");
const colorTool = document.getElementById("color");
const imageTool = document.getElementById("image");
const buttonTool = document.getElementById("Buttons");
const saveBtn = document.getElementById("saveBtn");

// --- STATE ---
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
    else { deactivateAllTools(); activeTool = "select"; selectTool.classList.add("active-tool"); }
});

// --- HISTORY FUNCTIONS ---
function saveHistory() {
    const editorContainer = document.getElementById("editor-area") || document.body;
    historyStack = historyStack.slice(0, historyIndex + 1);
    historyStack.push(editorContainer.innerHTML);
    historyIndex++;
    localStorage.setItem("onkaan-history", JSON.stringify(historyStack));
    localStorage.setItem("onkaan-historyIndex", historyIndex);
}

function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        const editorContainer = document.getElementById("editor-area") || document.body;
        editorContainer.innerHTML = historyStack[historyIndex];
        localStorage.setItem("onkaan-historyIndex", historyIndex);
    }
}

function redo() {
    if (historyIndex < historyStack.length - 1) {
        historyIndex++;
        const editorContainer = document.getElementById("editor-area") || document.body;
        editorContainer.innerHTML = historyStack[historyIndex];
        localStorage.setItem("onkaan-historyIndex", historyIndex);
    }
}

undoBtn?.addEventListener("click", undo);
redoBtn?.addEventListener("click", redo);
document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "z") { e.preventDefault(); undo(); }
    else if (e.ctrlKey && e.key === "y") { e.preventDefault(); redo(); }
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

    input.addEventListener("input", (e) => {
        if (!selectedElement) return;
        const tag = selectedElement.tagName;
        if (selectedElement.isContentEditable || ["P","H1","H2","H3","H4","H5","H6","SPAN","A","LABEL"].includes(tag)) {
            selectedElement.style.color = e.target.value;
        } else if (["DIV","SECTION","FOOTER"].includes(tag) || selectedElement.classList.contains("product-box")) {
            selectedElement.style.backgroundColor = e.target.value;
        } else if (tag === "IMG") {
            selectedElement.style.borderColor = e.target.value;
        }
    });

    okBtn.addEventListener("click", () => {
        saveHistory();
        colorPanel.remove();
        colorPanel = null;
    });
});

// --- ELEMENT SELECTION & TEXT TOOL ---
document.addEventListener("click", (e) => {
    const target = e.target;
    // Prevent clicks on toolbar buttons
    if ([textTool, selectTool, colorTool, undoBtn, redoBtn, saveBtn, imageTool, buttonTool].includes(target)) return;

    const editorContainer = document.getElementById("editor-area") || document.body;

    if (activeTool === "select") {
        if (selectedElement) selectedElement.style.outline = "none";
        selectedElement = target;
        selectedElement.style.outline = "2px solid blue";
        makeResizable(selectedElement);
    } else if (activeTool === "text") {
        const newEl = document.createElement("p");
        newEl.textContent = "Edit me";
        newEl.contentEditable = "true";
        newEl.style.outline = "1px dashed gray";
        editorContainer.appendChild(newEl);
        saveHistory();
    }
});

// --- SAVE BUTTON ---
saveBtn?.addEventListener("click", () => {
    saveHistory();
    alert("Changes saved!");
});

// --- RESIZING ---
function removeHandles() { document.querySelectorAll(".resize-handle").forEach(h => h.remove()); }

function makeResizable(el) {
    removeHandles();
    el.style.position = "relative";

    const handle = document.createElement("div");
    handle.className = "resize-handle";
    handle.style.width = "10px";
    handle.style.height = "10px";
    handle.style.background = "red";
    handle.style.position = "absolute";
    handle.style.right = "0";
    handle.style.bottom = "0";
    handle.style.cursor = "se-resize";
    handle.style.zIndex = "9999";

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
            isResizing = false;
            document.removeEventListener("mousemove", resizeMove);
            document.removeEventListener("mouseup", stopResize);
            saveHistory();
        }

        document.addEventListener("mousemove", resizeMove);
        document.addEventListener("mouseup", stopResize);
    });
}

// --- RESTORE HISTORY ON LOAD ---
window.addEventListener("load", () => {
    const savedHistory = JSON.parse(localStorage.getItem("onkaan-history") || "[]");
    const savedIndex = parseInt(localStorage.getItem("onkaan-historyIndex") || "-1", 10);
    const editorContainer = document.getElementById("editor-area") || document.body;

    if (savedHistory.length > 0 && savedIndex >= 0) {
        historyStack = savedHistory;
        historyIndex = savedIndex;
        editorContainer.innerHTML = historyStack[historyIndex];
    }
});
