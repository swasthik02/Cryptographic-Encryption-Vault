let notes = [];
let masterPassword = "";
async function getKey(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 600000,
            hash: "SHA-256"
        },
        keyMaterial,
        {
            name: "AES-GCM",
            length: 256
        },
        false,
        ["encrypt", "decrypt"]
    );
}
function createVault() {
    masterPassword = document.getElementById("password").value;
    if (masterPassword.length < 8) {
        document.getElementById("status").textContent =
            "Password must contain at least 8 characters.";
        return;
    }
    document.getElementById("vault").style.display = "block";
    document.getElementById("status").textContent =
        "Vault created successfully!";
}
function addNote() {
    const title = document.getElementById("title").value.trim();
    const message = document.getElementById("message").value.trim();
    if (!title || !message) {
        alert("Please enter both title and message.");
        return;
    }
    notes.push({ title, message });
    document.getElementById("title").value = "";
    document.getElementById("message").value = "";
    displayNotes();
}
function displayNotes() {
    const notesDiv = document.getElementById("notes");
    notesDiv.innerHTML = "";
    notes.forEach((note) => {
        const div = document.createElement("div");
        div.className = "note";
        const heading = document.createElement("h3");
        heading.textContent = note.title;
        const paragraph = document.createElement("p");
        paragraph.textContent = note.message;
        div.appendChild(heading);
        div.appendChild(paragraph);
        notesDiv.appendChild(div);
    });
}
async function saveVault() {
    try {
        if (!crypto.subtle) {
            alert("Please run this project using localhost or HTTPS.");
            return;
        }
        const encoder = new TextEncoder();
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const key = await getKey(masterPassword, salt);
        const encryptedData = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            key,
            encoder.encode(JSON.stringify(notes))
        );
        const header = new Uint8Array(32);
        header.set(encoder.encode("CV01"), 0);
        header.set(salt, 4);
        header.set(iv, 20);
        const output = new Uint8Array(
            header.length + encryptedData.byteLength
        );
        output.set(header);
        output.set(new Uint8Array(encryptedData), header.length);
        const blob = new Blob([output]);
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "encrypted-vault.vault";
        link.click();
        URL.revokeObjectURL(link.href);
        document.getElementById("status").textContent =
            "Encrypted vault downloaded successfully!";
    } catch (error) {
        document.getElementById("status").textContent =
            "Encryption failed. Please try again.";
    }
}