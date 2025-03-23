document.addEventListener("DOMContentLoaded", () => {
  const log = (msg) => {
    document.querySelector("#log").textContent += `${msg}\n`;
  };

  const scannedData = [];
  const writtenData = [];
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
      log("❌ Please enter both a food item and expiration date.");
      return;
    }

    const message = `Food Item: ${foodItem}, Expiration Date: ${expirationDate}`;
    log(`> Attempting to write: ${message}`);

    try {
      // ✅ Create a new NDEF instance each time
      const ndef = new NDEFReader();
      await ndef.write(message);
      log(`✅ Successfully written to NFC tag: ${message}`);

      // ✅ Save the written data
      writtenData.push({
        foodItem,
        expirationDate,
      });
      displayData(); // Update UI
    } catch (error) {
      log("❌ Write failed: " + error);
    }
  });

  // ✅ Display written data
  function displayData() {
    const content = document.querySelector("#content");
    content.innerHTML = "";

    writtenData.forEach((item, index) => {
      const listItem = document.createElement("div");
      listItem.textContent = `${index + 1}. ${item.foodItem} - Expiration: ${item.expirationDate}`;
      content.appendChild(listItem);
    });
  }

// ✅ Export to Excel with proper capitalization and category
document.getElementById("downloadButton").addEventListener("click", () => {
  if (writtenData.length === 0) {
    log("❌ No data to export");
    return;
  }

  // Format and capitalize data
  const formattedData = writtenData.map((item) => ({
    FoodItem: capitalizeWords(item.foodItem),
    ExpirationDate: formatDate(item.expirationDate),
    Category: capitalizeWords(item.category || "Uncategorized"), // Handle empty category
  }));

  const ws = XLSX.utils.json_to_sheet(formattedData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Written Data");

  XLSX.writeFile(wb, "written_data.xlsx");
  log("> ✅ Excel file generated and downloaded");
});

// ✅ Capitalize first letter of each word
function capitalizeWords(str) {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

// ✅ Format expiration date to a readable format
function formatDate(dateString) {
  const date = new Date(dateString);
  if (isNaN(date)) return dateString;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
