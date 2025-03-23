document.addEventListener("DOMContentLoaded", () => {
  const log = (msg) => {
    document.querySelector("#log").textContent += `${msg}\n`;
  };

  const scannedData = [];
  const writtenData = [];
  const ndef = new NDEFReader();

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

    // ✅ Scan NFC Tag and check expiration
    document.getElementById("scanButton").addEventListener("click", async () => {
      log("User clicked scan button");

      try {
        const ndef = new NDEFReader();
        await ndef.scan();
        log("> Scan started");

        ndef.addEventListener("reading", ({ message, serialNumber }) => {
          log(`> Serial Number: ${serialNumber}`);
          log(`> Records: (${message.records.length})`);

          for (const record of message.records) {
            const textDecoder = new TextDecoder();
            const recordData = textDecoder.decode(record.data);
            log(`✅ Scanned Data: ${recordData}`);

            // ✅ Parse data for food item and expiration date
            const [foodItem, expirationDate] = recordData.split(", ").map((item) => item.split(": ")[1]);

            if (foodItem && expirationDate) {
              log(`✅ Food: ${foodItem} | Expiration: ${expirationDate}`);
              checkExpiration(foodItem, expirationDate);
            }
          }
        });

        ndef.addEventListener("readingerror", () => {
          log("❌ Error reading NFC tag");
        });
      } catch (error) {
        log("❌ " + error);
      }
    });

    // ✅ Check expiration and send notification if close
    function checkExpiration(foodItem, expirationDate) {
      const expDate = new Date(expirationDate);
      const currentDate = new Date();
      const daysLeft = Math.floor((expDate - currentDate) / (1000 * 60 * 60 * 24));

      log(`📅 Days left for ${foodItem}: ${daysLeft} days`);

      if (daysLeft <= 3) {
        notifyUser(`${foodItem} is about to expire in ${daysLeft} day(s)!`);
      }
    }

    // ✅ Send a browser notification
    function notifyUser(message) {
      if (Notification.permission === "granted") {
        new Notification("⚠️ Expiration Alert", { body: message });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification("⚠️ Expiration Alert", { body: message });
          }
        });
      }
    }

    // ✅ Display logged data
    function displayData() {
      const content = document.querySelector("#content");
      content.innerHTML = "";

      writtenData.forEach((item, index) => {
        const listItem = document.createElement("div");
        listItem.textContent = `${index + 1}. ${item.foodItem} - Expiration: ${item.expirationDate}`;
        content.appendChild(listItem);
      });
    }

    // ✅ Export to Excel
    document.getElementById("downloadButton").addEventListener("click", () => {
      if (writtenData.length === 0) {
        log("❌ No data to export");
        return;
      }

      const ws = XLSX.utils.json_to_sheet(writtenData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Written Data");

      XLSX.writeFile(wb, "written_data.xlsx");
      log("> ✅ Excel file generated and downloaded");
    });

    // ✅ Ask permission for notifications
    if ("Notification" in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          log("✅ Notifications enabled");
        } else {
          log("❌ Notifications denied");
        }
      });
    }
