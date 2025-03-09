document.addEventListener("DOMContentLoaded", () => {
    const dropArea = document.getElementById("drop-area");
    const fileInput = document.getElementById("fileInput");
    const uploadBtn = document.getElementById("uploadBtn");
    const fileList = document.getElementById("fileList");

    dropArea.addEventListener("click", () => fileInput.click());
    dropArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropArea.style.background = "#e3e3e3";
    });
    dropArea.addEventListener("dragleave", () => dropArea.style.background = "#f9f9f9");
    dropArea.addEventListener("drop", (e) => {
        e.preventDefault();
        fileInput.files = e.dataTransfer.files;
    });

    uploadBtn.addEventListener("click", () => {
        const files = fileInput.files;
        if (files.length === 0) return alert("No files selected");
        
        const formData = new FormData();
        for (let file of files) formData.append("file", file);
        
        fetch("/upload", { method: "POST", body: formData })
            .then(res => res.json())
            .then(() => loadFiles());
    });

    function loadFiles() {
        fetch("/files")
            .then(res => res.json())
            .then(files => {
                fileList.innerHTML = "";
                files.forEach(file => {
                    const li = document.createElement("li");
                    li.innerHTML = `
                        ${file} 
                        <button onclick="downloadFile('${file}')">Download</button>
                        <button onclick="deleteFile('${file}')">Delete</button>
                    `;
                    fileList.appendChild(li);
                });
            });
    }

    window.downloadFile = (filename) => {
        window.location.href = `/download/${filename}`;
    };

    window.deleteFile = (filename) => {
        fetch(`/delete/${filename}`, { method: "DELETE" })
            .then(() => loadFiles());
    };

    loadFiles();
});
