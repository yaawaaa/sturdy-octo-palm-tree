const log = (msg) => {
    document.querySelector('#log').textContent += `${msg}\n`;
};

const scannedData = []; // ✅ Local array to store data

// ✅ Create a single NDEFReader instance
const ndef = new NDEFReader();

async function startScan() {
    log("User clicked scan button");

    try {
        await ndef.scan(); // Start scanning
        log("> Scan started");
    } catch (error) {
        log("Argh! " + error);
    }
}

function handleReadingError() {
    log("Argh! Cannot read data from the NFC tag. Try another one?");
}

function handleReading({ message, serialNumber }) {
    log(`> Serial Number: ${serialNumber}`);
    log(`> Records: (${message.records.length})`);

    for (const record of message.records) {
        const decoder = new TextDecoder();
        const data = decoder.decode(record.data);
        log(`> Data: ${data}`);

        // ✅ Check for duplicates before adding
        const exists = scannedData.some(
            (item) => item.serialNumber === serialNumber && item.data === data
        );
        if (!exists) {
            scannedData.push({
                serialNumber,
                data,
                timestamp: new Date().toLocaleString(),
            });
            displayData();
        } else {
            log(`> Duplicate entry ignored`);
        }
    }
}

// ✅ Attach the event listeners only once
ndef.addEventListener("reading", handleReading);
ndef.addEventListener("readingerror", handleReadingError);

document.getElementById("scanButton").addEventListener("click", startScan);

// ✅ Display scanned data
function displayData() {
    const content = document.querySelector("#content");
    content.innerHTML = ""; // Clear previous content

    scannedData.forEach((item, index) => {
        const listItem = document.createElement("div");
        listItem.textContent = `${index + 1}. ${item.serialNumber} - ${item.data} (${item.timestamp})`;
        content.appendChild(listItem);
    });
}

// ✅ Export to Excel
document.getElementById("downloadButton").addEventListener("click", () => {
    if (scannedData.length === 0) {
        log("No data to export");
        return;
    }

    const ws = XLSX.utils.json_to_sheet(scannedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Scanned Data");

    XLSX.writeFile(wb, "scanned_data.xlsx");
    log("> Excel file generated and downloaded");
});
