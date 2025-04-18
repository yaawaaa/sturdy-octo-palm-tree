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
    const count = parseInt(document.getElementById("count").value.trim()) || 1; // ✅ Default count to 1
    const grams = document.getElementById("grams").value.trim() || ""; // ✅ Allow blank grams

    if (!foodItem || !expirationDate) {
      log("❌ Please enter a valid food item and expiration date.");
      return;
    }

    const message = `Food Item: ${foodItem}, Expiration Date: ${expirationDate}, Count: ${count}, Grams: ${grams}`;
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
        count,
        grams,
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
      listItem.textContent = `${index + 1}. ${item.foodItem} - Expiration: ${item.expirationDate} - Count: ${item.count} - Grams: ${item.grams || "N/A"}`;
      content.appendChild(listItem);
    });
  }

  // ✅ Export to Excel (with Proper Headers + Capitalization)
  document.getElementById("downloadButton").addEventListener("click", () => {
    if (writtenData.length === 0) {
      log("❌ No data to export");
      return;
    }

    try {
      // ✅ Format and capitalize data
      const formattedData = writtenData.map((item) => ({
        "Food Item": capitalizeWords(item.foodItem),
        "Expiration Date": formatDate(item.expirationDate),
        "Count": item.count,
        "Grams": item.grams || "N/A",
      }));

      const ws = XLSX.utils.json_to_sheet(formattedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Written Data");

      XLSX.writeFile(wb, "written_data.xlsx");
      log("> ✅ Excel file generated and downloaded");
    } catch (error) {
      log("❌ Excel export failed: " + error);
    }
  });

  // ✅ Capitalize Words
  function capitalizeWords(str) {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  // ✅ Format Date to "Month Day, Year"
  function formatDate(dateString) {
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
});
