document.addEventListener("DOMContentLoaded", () => {
  const log = (msg) => {
    document.querySelector("#log").textContent += `${msg}\n`;
  };

  const scannedData = [];
  const ndef = new NDEFReader();

  // ✅ Start Scan
  document.getElementById("scanButton").addEventListener("click", async () => {
    log("User clicked scan button");

    try {
      await ndef.scan();
      log("> Scan started");
    } catch (error) {
      log("Argh! " + error);
    }
  });

  ndef.addEventListener("reading", ({ message, serialNumber }) => {
    log(`> Serial Number: ${serialNumber}`);
    log(`> Records: (${message.records.length})`);

    for (const record of message.records) {
      const decoder = new TextDecoder();
      const data = decoder.decode(record.data);
      log(`> Data: ${data}`);

      // ✅ Prevent duplicate data
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
  });

  ndef.addEventListener("readingerror", () => {
    log("Argh! Cannot read data from the NFC tag. Try another one?");
  });

  // ✅ Write to NFC Tag
  document.getElementById("writeButton").addEventListener("click", async () => {
    const foodItem = document.getElementById("foodItem").value.trim();
    const expirationDate = document.getElementById("expirationDate").value;

    if (!foodItem || !expirationDate) {
      log("Please enter both a food item and expiration date.");
      return;
    }

    const message = `Food Item: ${foodItem}, Expiration Date: ${expirationDate}`;
    log(`> Attempting to write: ${message}`);

    try {
      await ndef.write(message);
      log(`✅ Successfully written to NFC tag: ${message}`);
    } catch (error) {
      log("❌ Write failed: " + error);
    }
  });

  // ✅ Display scanned data
  function displayData() {
    const content = document.querySelector("#content");
    content.innerHTML = "";

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
});
