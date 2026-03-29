let html5QrCode;
let capturedPhoto = null;

const startBtn = document.getElementById("btn-start");
const stopBtn = document.getElementById("btn-stop");
const manualInput = document.getElementById("manual-qr");
const manualBtn = document.getElementById("btn-manual");
const infoSection = document.getElementById("info-section");
const distributeForm = document.getElementById("distributeForm");

// Photo capture function
async function capturePhoto() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
    });

    const video = document.createElement("video");
    video.srcObject = stream;
    video.play();

    const modal = document.createElement("div");
    modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(0,0,0,0.8); z-index: 1000; display: flex; 
            justify-content: center; align-items: center; flex-direction: column;
        `;

    const videoContainer = document.createElement("div");
    videoContainer.style.cssText = `
            position: relative; max-width: 400px; width: 100%;
        `;
    videoContainer.appendChild(video);

    const captureBtn = document.createElement("button");
    captureBtn.textContent = "📷 Capture Photo";
    captureBtn.className = "btn btn-primary";
    captureBtn.style.marginTop = "1rem";

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.className = "btn btn-secondary";
    cancelBtn.style.marginLeft = "1rem";

    const buttonContainer = document.createElement("div");
    buttonContainer.appendChild(captureBtn);
    buttonContainer.appendChild(cancelBtn);

    modal.appendChild(videoContainer);
    modal.appendChild(buttonContainer);
    document.body.appendChild(modal);

    captureBtn.onclick = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);

      capturedPhoto = canvas.toDataURL("image/jpeg");
      document.getElementById("beneficiary-photo").src = capturedPhoto;
      document.getElementById("photo-container").style.display = "block";

      stream.getTracks().forEach((track) => track.stop());
      modal.remove();

      showMessage("success", "Photo captured successfully!");
    };

    cancelBtn.onclick = () => {
      stream.getTracks().forEach((track) => track.stop());
      modal.remove();
    };
  } catch (error) {
    showMessage("error", "Failed to access camera for photo capture");
    console.error("Photo capture error:", error);
  }
}

// Initialize scanner
function onScanSuccess(decodedText, decodedResult) {
  // Handle on success condition with the decoded text or result.
  console.log(`Scan result: ${decodedText}`);
  stopScanner(); // stop scanning after success
  verifyBeneficiary(decodedText);
}

function onScanFailure(error) {
  // handle scan failure, usually better to ignore and keep scanning
  // console.warn(`Code scan error = ${error}`);
}

async function startScanner() {
  try {
    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode("reader");
    }

    infoSection.style.display = "none";

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    await html5QrCode.start(
      { facingMode: "environment" },
      config,
      onScanSuccess,
      onScanFailure,
    );

    startBtn.style.display = "none";
    stopBtn.style.display = "inline-block";
    showMessage("success", "Scanner started");
  } catch (err) {
    showMessage("error", "Failed to start camera. Please check permissions.");
    console.error(err);
  }
}

async function stopScanner() {
  if (html5QrCode && html5QrCode.isScanning) {
    try {
      await html5QrCode.stop();
      startBtn.style.display = "inline-block";
      stopBtn.style.display = "none";
    } catch (err) {
      console.error("Failed to stop scanner", err);
    }
  }
}

async function verifyBeneficiary(qrId) {
  showMessage("warning", "Verifying ID...");
  const response = await api.beneficiary.get(qrId);

  if (response.success) {
    const b = response.data;
    document.getElementById("b-name").innerText = b.name;
    document.getElementById("b-age").innerText = b.age;
    document.getElementById("b-phone").innerText = b.phone;
    document.getElementById("b-address").innerText = b.address;

    const pBadge = document.getElementById("b-priority");
    pBadge.innerText = b.priority;
    pBadge.className = "badge"; // reset
    if (b.priority === "High") pBadge.classList.add("badge-high");
    else if (b.priority === "Medium") pBadge.classList.add("badge-medium");
    else pBadge.classList.add("badge-low");

    document.getElementById("distribute-qr").value = b.qrId;

    infoSection.style.display = "block";
    showMessage("success", "Beneficiary verified successfully.");
  } else {
    infoSection.style.display = "none";
    showMessage("error", "Invalid QR ID or Beneficiary not found.");
  }
}

// Event Listeners
startBtn.addEventListener("click", startScanner);
stopBtn.addEventListener("click", stopScanner);
manualBtn.addEventListener("click", () => {
  const val = manualInput.value.trim();
  if (val) verifyBeneficiary(val);
  else showMessage("warning", "Please enter an ID");
});

// Distribute form
distributeForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const qrId = document.getElementById("distribute-qr").value;
  const itemsRaw = document.getElementById("items").value;
  const region = document.getElementById("region").value;
  const notes = document.getElementById("notes").value;

  let items = undefined;
  if (itemsRaw.trim()) {
    items = itemsRaw.split(",").map((i) => i.trim());
  }

  const submitBtn = e.target.querySelector("button");
  submitBtn.disabled = true;

  showMessage("warning", "Validating duplicate records...");

  const distributionData = { qrId, items, region };
  if (notes.trim()) {
    distributionData.notes = notes.trim();
  }
  if (capturedPhoto) {
    distributionData.photo = capturedPhoto;
  }

  const response = await api.aid.distribute(distributionData);

  if (response.success) {
    showMessage("success", "Aid recorded successfully!");

    // Synthetic Success Beep
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {}

    // Reset Form
    document.getElementById("items").value = "Food Package";
    document.getElementById("notes").value = "";
    document.getElementById("photo-container").style.display = "none";
    capturedPhoto = null;
    submitBtn.style.backgroundColor = "";
    submitBtn.innerText = "Record Aid Distribution";

    setTimeout(() => {
      infoSection.style.display = "none";
      manualInput.value = "";
    }, 2000);
  } else {
    showMessage("error", response.error || "Failed to record aid.");

    // Detect if this was a Duplicate/Cooldown Block
    const isDuplicate = response.error.toLowerCase().includes("cooldown") || 
                        response.error.toLowerCase().includes("already");

    if (isDuplicate) {
      submitBtn.style.backgroundColor = "var(--danger)";
      submitBtn.style.color = "#fff";
      submitBtn.innerText = "DUPLICATE BLOCKED";
      
      // Visual Blink effect on the card
      const formCard = document.querySelector(".card.active") || document.querySelector(".card");
      if(formCard) {
        formCard.style.animation = "pulse 0.3s ease infinite";
        setTimeout(() => { formCard.style.animation = ""; }, 1200);
      }

      // Stronger Alarm Audio (Double Beep)
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        function beep(freq, duration, delay = 0) {
          const osc = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          osc.connect(g);
          g.connect(audioCtx.destination);
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
          g.gain.setValueAtTime(0.2, audioCtx.currentTime + delay);
          g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration);
          osc.start(audioCtx.currentTime + delay);
          osc.stop(audioCtx.currentTime + delay + duration);
        }
        beep(120, 0.4); // First beep
        beep(120, 0.4, 0.5); // Second beep
      } catch (e) {}

      setTimeout(() => {
        submitBtn.style.backgroundColor = "";
        submitBtn.innerText = "Record Aid Distribution";
      }, 4000);
    }
  }

  setTimeout(() => {
    submitBtn.disabled = false;
  }, 2000);
});
