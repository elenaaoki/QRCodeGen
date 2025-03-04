document.addEventListener("DOMContentLoaded", function() {
    // Tab switching
    const tabBtns = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");
    
    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            // Remove active class from all buttons and contents
            tabBtns.forEach(b => b.classList.remove("active"));
            tabContents.forEach(c => c.classList.remove("active"));
            
            // Add active class to clicked button and corresponding content
            btn.classList.add("active");
            const tabId = btn.getAttribute("data-tab");
            document.getElementById(`${tabId}-tab`).classList.add("active");
        });
    });
    
    // Color selection for regular QR code
    setupColorSelection(".color-btn", "#fg-color-hex", "#fg-color-picker");
    setupColorSelection(".bg-color-btn", "#bg-color-hex", "#bg-color-picker");
    
    // Color selection for WiFi QR code
    setupColorSelection(".wifi-color-btn", "#wifi-fg-color-hex", "#wifi-fg-color-picker");
    setupColorSelection(".wifi-bg-color-btn", "#wifi-bg-color-hex", "#wifi-bg-color-picker");
    
    // Sync color picker with hex input
    syncColorInputs("#fg-color-picker", "#fg-color-hex");
    syncColorInputs("#bg-color-picker", "#bg-color-hex");
    syncColorInputs("#wifi-fg-color-picker", "#wifi-fg-color-hex");
    syncColorInputs("#wifi-bg-color-picker", "#wifi-bg-color-hex");
    
    // Generate regular QR code
    document.getElementById("generate-regular").addEventListener("click", generateRegularQR);
    
    // Generate WiFi QR code
    document.getElementById("generate-wifi").addEventListener("click", generateWifiQR);
    
    // Download QR code
    document.getElementById("download-btn").addEventListener("click", function() {
        downloadQRCode();
        // Reset the download button state to ensure it works for future generations
        setTimeout(() => {
            const downloadBtn = document.getElementById('download-btn');
            downloadBtn.disabled = false;
        }, 500);
    });
});

function setupColorSelection(buttonSelector, hexInputSelector, colorPickerSelector) {
    const buttons = document.querySelectorAll(buttonSelector);
    const hexInput = document.querySelector(hexInputSelector);
    const colorPicker = document.querySelector(colorPickerSelector);
    
    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            // Remove active class from all buttons
            buttons.forEach(b => b.classList.remove("active"));
            
            // Add active class to clicked button
            btn.classList.add("active");
            
            // Update hex input and color picker
            const color = btn.getAttribute("data-color");
            hexInput.value = color;
            colorPicker.value = color;
        });
    });
}

function syncColorInputs(pickerSelector, hexSelector) {
    const picker = document.querySelector(pickerSelector);
    const hexInput = document.querySelector(hexSelector);
    
    picker.addEventListener("input", () => {
        hexInput.value = picker.value;
        
        // Remove active class from all related color buttons
        const buttonClass = pickerSelector.includes("fg")
            ? pickerSelector.includes("wifi")
                ? ".wifi-color-btn"
                : ".color-btn"
            : pickerSelector.includes("wifi")
                ? ".wifi-bg-color-btn"
                : ".bg-color-btn";
        
        document.querySelectorAll(buttonClass).forEach(btn => {
            btn.classList.remove("active");
        });
    });
    
    hexInput.addEventListener("input", () => {
        // Validate hex color
        const hexColor = hexInput.value;
        if (/^#[0-9A-F]{6}$/i.test(hexColor)) {
            picker.value = hexColor;
            
            // Remove active class from all related color buttons
            const buttonClass = pickerSelector.includes("fg")
                ? pickerSelector.includes("wifi")
                    ? ".wifi-color-btn"
                    : ".color-btn"
                : pickerSelector.includes("wifi")
                    ? ".wifi-bg-color-btn"
                    : ".bg-color-btn";
            
            document.querySelectorAll(buttonClass).forEach(btn => {
                btn.classList.remove("active");
            });
        }
    });
}

function generateRegularQR() {
    const text = document.getElementById("text-input").value.trim();
    if (!text) {
        alert("Please enter some text or URL");
        return;
    }
    
    const fgColor = document.getElementById("fg-color-hex").value;
    const bgColor = document.getElementById("bg-color-hex").value;
    
    generateQRCode(text, fgColor, bgColor);
}

function generateWifiQR() {
    const ssid = document.getElementById("wifi-ssid").value.trim();
    const password = document.getElementById("wifi-password").value;
    const encryption = document.getElementById("wifi-encryption").value;
    
    if (!ssid) {
        alert("Please enter WiFi name (SSID)");
        return;
    }
    
    // Format WiFi connection string
    let wifiString = `WIFI:S:${escapeWifiString(ssid)};`;
    
    if (encryption !== "nopass") {
        wifiString += `T:${encryption};`;
        if (password) {
            wifiString += `P:${escapeWifiString(password)};`;
        }
    } else {
        wifiString += "T:nopass;";
    }
    
    wifiString += ";";
    
    const fgColor = document.getElementById("wifi-fg-color-hex").value;
    const bgColor = document.getElementById("wifi-bg-color-hex").value;
    
    generateQRCode(wifiString, fgColor, bgColor);
}

function escapeWifiString(str) {
    // Escape special characters in WiFi strings
    return str.replace(/[\\;,:"]/g, "\\$&");
}

let qrCodeInstance = null;

function generateQRCode(text, fgColor, bgColor) {
    const qrContainer = document.getElementById('qr-code-container');
    qrContainer.innerHTML = '';
    
    // Add padding style to container (reduced from 20px to 10px)
    qrContainer.style.backgroundColor = bgColor;
    qrContainer.style.padding = '10px';
    qrContainer.style.borderRadius = '8px';
    
    // Create QR code with higher resolution
    qrCodeInstance = new QRCode(qrContainer, {
        text: text,
        width: 512, // Increased from 256 to 512 for sharper preview
        height: 512, // Increased from 256 to 512 for sharper preview
        colorDark: fgColor,
        colorLight: bgColor,
        correctLevel: QRCode.CorrectLevel.H // Highest error correction level
    });
    
    // Show result section and enable download button
    document.getElementById('result-section').style.display = 'block';
    document.getElementById('download-btn').disabled = false;
    
    // Scroll to result section
    document.getElementById('result-section').scrollIntoView({ behavior: 'smooth' });
}

function downloadQRCode() {
    if (!qrCodeInstance) return;
    
    // Create a high-resolution canvas (3840x3840 for ultra HD)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const size = 3840; // Ultra HD resolution
    const padding = size * 0.05; // 5% padding for visible frame
    canvas.width = size;
    canvas.height = size;
    
    // Get QR code colors
    let fgColor, bgColor;
    if (document.querySelector('.tab-btn.active').getAttribute('data-tab') === 'regular') {
        fgColor = document.getElementById('fg-color-hex').value;
        bgColor = document.getElementById('bg-color-hex').value;
    } else {
        fgColor = document.getElementById('wifi-fg-color-hex').value;
        bgColor = document.getElementById('wifi-bg-color-hex').value;
    }
    
    // Fill background for entire canvas
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);
    
    // Get QR code data from the existing instance
    const qrImg = qrCodeInstance._el.querySelector('img');
    
    // Create a new Image to draw the QR code at high resolution
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
        // Disable image smoothing for crisp edges
        ctx.imageSmoothingEnabled = false;
        
        // Draw QR code on high-resolution canvas with padding
        const qrSize = size - (padding * 2);
        ctx.drawImage(img, padding, padding, qrSize, qrSize);
        
        // Add a subtle border to make the frame more visible
        ctx.strokeStyle = bgColor;
        ctx.lineWidth = padding / 4;
        ctx.strokeRect(padding / 2, padding / 2, size - padding, size - padding);
        
        // Create download link
        const link = document.createElement('a');
        link.download = 'qrcode.jpg';
        
        // Convert canvas to blob and create URL with maximum quality
        canvas.toBlob(function(blob) {
            link.href = URL.createObjectURL(blob);
            link.click();
            URL.revokeObjectURL(link.href);
        }, 'image/jpeg', 1.0); // Maximum quality (1.0)
    };
    
    // Set source of image to QR code
    img.src = qrImg.src;
}