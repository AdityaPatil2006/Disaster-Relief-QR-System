(function() {
    const codeReader = new ZXing.BrowserQRCodeReader();
    let selectedDeviceId = null;
    const videoElement = document.getElementById('qr-video');
    const startBtn = document.getElementById('btn-start');
    const stopBtn = document.getElementById('btn-stop');
    const switchBtn = document.getElementById('btn-switch');
    const infoSection = document.getElementById('info-section');
    const readerDiv = document.getElementById('reader');

    async function init() {
        try {
            const videoInputDevices = await codeReader.listVideoInputDevices();
            if (videoInputDevices.length > 1) {
                switchBtn.style.display = 'inline-flex';
                // Try to find the environment camera by default
                const backCamera = videoInputDevices.find(device => 
                    device.label.toLowerCase().includes('back') || 
                    device.label.toLowerCase().includes('environment')
                );
                selectedDeviceId = backCamera ? backCamera.deviceId : videoInputDevices[0].deviceId;
            } else if (videoInputDevices.length === 1) {
                selectedDeviceId = videoInputDevices[0].deviceId;
            } else {
                showMessage('error', 'No cameras detected on this device.');
            }
        } catch (err) {
            console.error('Initial error:', err);
            showMessage('error', 'Critical: Camera permission denied or security block (HTTPS required).');
        }
    }

    async function startScanner() {
        if (!selectedDeviceId) await init();
        if (!selectedDeviceId) return;

        startBtn.style.display = 'none';
        stopBtn.style.display = 'inline-flex';
        readerDiv.classList.add('scanning');

        codeReader.decodeFromVideoDevice(selectedDeviceId, 'qr-video', (result, err) => {
            if (result) {
                console.log('Decoded:', result.text);
                const qrId = result.text.trim();
                verifyBeneficiary(qrId);
                stopScanner(); // Stop once found
            }
        }).catch(err => {
            console.error('Scan Error:', err);
            showMessage('error', 'Scanner failed. Please refresh and try again.');
        });
    }

    function stopScanner() {
        codeReader.reset();
        startBtn.style.display = 'inline-flex';
        stopBtn.style.display = 'none';
        readerDiv.classList.remove('scanning');
    }

    async function switchCamera() {
        const videoInputDevices = await codeReader.listVideoInputDevices();
        const currentIndex = videoInputDevices.findIndex(d => d.deviceId === selectedDeviceId);
        const nextIndex = (currentIndex + 1) % videoInputDevices.length;
        selectedDeviceId = videoInputDevices[nextIndex].deviceId;
        
        stopScanner();
        startScanner();
    }

    async function verifyBeneficiary(qrId) {
        if (!qrId) return;
        showMessage('warning', 'Validating digital identity...');
        
        const res = await api.beneficiary.get(qrId);
        if (res.success) {
            const b = res.data;
            document.getElementById('b-name').innerText = b.name;
            document.getElementById('b-age').innerText = b.age;
            document.getElementById('b-phone').innerText = b.phone;
            document.getElementById('b-address').innerText = b.address;
            document.getElementById('b-priority').innerText = b.priority;
            document.getElementById('b-priority').className = `badge badge-${b.priority.toLowerCase()}`;
            document.getElementById('distribute-qr').value = b.qrId;
            
            infoSection.style.display = 'block';
            infoSection.scrollIntoView({ behavior: 'smooth' });
            showMessage('success', 'Identity Verified.');
        } else {
            showMessage('error', res.error || 'Identity not found in database.');
        }
    }

    // Manual Entry
    document.getElementById('btn-manual').addEventListener('click', () => {
        const val = document.getElementById('manual-qr').value;
        if (val) verifyBeneficiary(val.trim());
    });

    // Form Distribution
    document.getElementById('distributeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const qrId = document.getElementById('distribute-qr').value;
        const item = document.getElementById('items').value;
        const region = document.getElementById('region').value;
        const notes = document.getElementById('notes').value;

        // Wrap the single item selection in an array for the backend
        const items = [item];

        const btn = e.target.querySelector('button');
        btn.disabled = true;
        btn.innerText = 'Synchronizing Dispatch...';

        const res = await api.aid.distribute({ qrId, items, region, notes });
        btn.disabled = false;
        btn.innerText = 'Confirm Dispatch';

        if (res.success) {
            showMessage('success', 'Distribution logged and synchronized.');
            infoSection.style.display = 'none';
            document.getElementById('manual-qr').value = '';
        } else {
            // Error message will automatically trigger beep in ui.js
            showMessage('error', res.error || 'Distribution protocol failed.');
        }
    });

    window.capturePhoto = function() {
        const canvas = document.getElementById('qr-canvas');
        const video = document.getElementById('qr-video');
        if (!video.srcObject) return showMessage('error', 'Camera is not active.');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        
        const photo = document.getElementById('beneficiary-photo');
        photo.src = canvas.toDataURL('image/png');
        document.getElementById('photo-container').style.display = 'block';
        showMessage('success', 'Evidence photo captured.');
    };

    startBtn.addEventListener('click', startScanner);
    stopBtn.addEventListener('click', stopScanner);
    switchBtn.addEventListener('click', switchCamera);

    // Initial check
    init();
})();
