document.addEventListener("DOMContentLoaded", () => {
  const log = (msg) => {
    document.querySelector("#log").textContent += `${msg}\n`;
  };

  const scannedData = [];
  const writtenData = [];
  const ndef = new NDEFReader();

    // ✅ Request Notification Permission on Page Load
  if (Notification.permission !== "granted" && Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      console.log("Notification permission:", permission);
    }
  });

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
    
  // ✅ Save to array for notification tracking
      writtenData.push({
        foodItem,
        expirationDate: new Date(expirationDate)
      });
      displayData();
    } catch (error) {
      log("❌ Write failed: " + error);
    }
  });

  // ✅ Notify if close to expiration date (check every 10 seconds)
  setInterval(() => {
    const today = new Date();

    writtenData.forEach((item) => {
      const daysLeft = Math.ceil((item.expirationDate - today) / (1000 * 60 * 60 * 24));

      // ✅ Notify if within 3 days of expiration
      if (daysLeft <= 3 && daysLeft >= 0) {
        notifyUser(`${item.foodItem} expires in ${daysLeft} day(s)!`);
      }
    });
  }, 10000); // Check every 10 seconds

  // ✅ Notification function
  function notifyUser(message) {
    if (Notification.permission === "granted") {
      new Notification("⚠️ Expiration Alert", { body: message });
      log(`🚨 Notification sent: ${message}`);
    } else {
      log("❌ Notification permission denied");
    }

  // ✅ Export to Excel
  document.getElementById("downloadButton").addEventListener("click", () => {
    if (writtenData.length === 0) {
      log("❌ No data to export");
      return;
    }

    try {
      const ws = XLSX.utils.json_to_sheet(writtenData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Written Data");

      XLSX.writeFile(wb, "written_data.xlsx");
      log("> ✅ Excel file generated and downloaded");
    } catch (error) {
      log("❌ Excel export failed: " + error);
    }
  });
});
