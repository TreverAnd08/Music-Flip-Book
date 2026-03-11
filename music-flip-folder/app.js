// Role switching
const btnDirector = document.getElementById("btnDirector");
const btnStudent = document.getElementById("btnStudent");
const directorPanel = document.getElementById("directorPanel");
const studentPanel = document.getElementById("studentPanel");

btnDirector.onclick = () => {
    btnDirector.classList.add("active");
    btnStudent.classList.remove("active");
    directorPanel.classList.remove("hidden");
    studentPanel.classList.add("hidden");
};

btnStudent.onclick = () => {
    btnStudent.classList.add("active");
    btnDirector.classList.remove("active");
    studentPanel.classList.remove("hidden");
    directorPanel.classList.add("hidden");
};

// Status UI
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");

function setStatus(text, connected = false) {
    statusText.textContent = text;
    if (connected) {
        statusDot.classList.add("active");
        statusDot.classList.remove("inactive");
    } else {
        statusDot.classList.remove("active");
        statusDot.classList.add("inactive");
    }
}

// Director: load pages
const musicUpload = document.getElementById("musicUpload");
const pagesList = document.getElementById("pagesList");
const studentPage = document.getElementById("studentPage");

let pages = [];          // { url, name }
let currentPageIndex = -1;

// Simple image-only prototype (PDF handling would need extra libs)
musicUpload.onchange = (e) => {
    const files = Array.from(e.target.files);
    pages = [];
    pagesList.innerHTML = "";

    files.forEach((file, index) => {
        const url = URL.createObjectURL(file);
        const pageObj = { url, name: file.name || `Page ${index + 1}` };
        pages.push(pageObj);
        addPageThumb(pageObj, index);
    });

    if (pages.length > 0) {
        selectPage(0);
    }
};

function addPageThumb(page, index) {
    const div = document.createElement("div");
    div.className = "page-thumb";
    div.dataset.index = index;

    const img = document.createElement("img");
    img.src = page.url;
    img.onload = () => {}; // just to ensure load

    div.appendChild(img);
    div.onclick = () => selectPage(index);
    pagesList.appendChild(div);
}

function selectPage(index) {
    currentPageIndex = index;

    // highlight
    document.querySelectorAll(".page-thumb").forEach(el => {
        el.classList.toggle("active", Number(el.dataset.index) === index);
    });

    // show in director preview (reuse studentPage for local preview)
    studentPage.innerHTML = "";
    const img = document.createElement("img");
    img.src = pages[index].url;
    studentPage.appendChild(img);

    // broadcast to students
    broadcastCurrentPage().catch(err => {
        console.warn("Broadcast failed (no students yet?):", err);
    });
}

// Bluetooth prototype
const SERVICE_UUID = "0000feed-0000-1000-8000-00805f9b34fb";
const CHAR_UUID = "0000beef-0000-1000-8000-00805f9b34fb";

let directorCharacteristic = null;
let studentCharacteristic = null;

// Director: start host (in real BLE, you'd advertise; Web Bluetooth is limited)
document.getElementById("btnStartHost").onclick = async () => {
    if (!("bluetooth" in navigator)) {
        alert("Web Bluetooth not supported in this browser.");
        return;
    }

    // Web Bluetooth cannot truly act as a peripheral/host yet in most browsers.
    // So this is a conceptual placeholder for when that’s available.
    alert("Note: Full director-as-host over Web Bluetooth is limited.\nThis is a prototype of the flow.");
    setStatus("Director ready (local preview only)", false);
};

// Student: connect to director (conceptual)
document.getElementById("btnConnectStudent").onclick = async () => {
    if (!("bluetooth" in navigator)) {
        alert("Web Bluetooth not supported in this browser.");
        return;
    }

    try {
        setStatus("Searching for director…", false);

        const device = await navigator.bluetooth.requestDevice({
            filters: [{ services: [SERVICE_UUID] }]
        });

        const server = await device.gatt.connect();
        const service = await server.getPrimaryService(SERVICE_UUID);
        const characteristic = await service.getCharacteristic(CHAR_UUID);

        studentCharacteristic = characteristic;
        await characteristic.startNotifications();

        characteristic.addEventListener("characteristicvaluechanged", (event) => {
            const value = event.target.value;
            const blob = new Blob([value.buffer], { type: "image/png" });
            const url = URL.createObjectURL(blob);

            studentPage.innerHTML = "";
            const img = document.createElement("img");
            img.src = url;
            studentPage.appendChild(img);
        });

        setStatus("Connected to director", true);
    } catch (err) {
        console.error(err);
        setStatus("Connection failed", false);
    }
};

// Director: broadcast current page to students
async function broadcastCurrentPage() {
    if (!pages[currentPageIndex]) return;
    if (!directorCharacteristic) {
        // In real BLE peripheral mode, you'd write to connected centrals.
        // Web Bluetooth doesn't expose that yet; this is a placeholder.
        return;
    }

    const response = await fetch(pages[currentPageIndex].url);
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    const chunk = new Uint8Array(buffer);

    await directorCharacteristic.writeValue(chunk);
}
