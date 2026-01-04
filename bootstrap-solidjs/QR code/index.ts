import { serve } from "bun";
import QRCode from "qrcode";

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR Code Generator</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      padding: 40px;
      max-width: 500px;
      width: 100%;
    }

    h1 {
      color: #333;
      margin-bottom: 8px;
      font-size: 28px;
      text-align: center;
    }

    .subtitle {
      color: #666;
      text-align: center;
      margin-bottom: 32px;
      font-size: 14px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      color: #444;
      margin-bottom: 8px;
      font-weight: 500;
      font-size: 14px;
    }

    input[type="url"] {
      width: 100%;
      padding: 14px 16px;
      border: 2px solid #e1e5e9;
      border-radius: 10px;
      font-size: 16px;
      transition: border-color 0.2s, box-shadow 0.2s;
      outline: none;
    }

    input[type="url"]:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
    }

    button {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
    }

    button:active {
      transform: translateY(0);
    }

    button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }

    .qr-result {
      margin-top: 32px;
      text-align: center;
      display: none;
    }

    .qr-result.show {
      display: block;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .qr-result h2 {
      color: #333;
      font-size: 18px;
      margin-bottom: 16px;
    }

    #qr-image {
      max-width: 100%;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .download-btn {
      display: inline-block;
      margin-top: 16px;
      padding: 10px 24px;
      background: #333;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      transition: background 0.2s;
    }

    .download-btn:hover {
      background: #555;
    }

    .error {
      color: #e74c3c;
      text-align: center;
      margin-top: 16px;
      font-size: 14px;
      display: none;
    }

    .error.show {
      display: block;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>QR Code Generator</h1>
    <p class="subtitle">Enter any URL to generate a QR code</p>

    <form id="qr-form">
      <div class="form-group">
        <label for="url">URL</label>
        <input type="url" id="url" name="url" placeholder="https://example.com" required>
      </div>
      <button type="submit" id="submit-btn">Generate QR Code</button>
    </form>

    <div class="error" id="error"></div>

    <div class="qr-result" id="qr-result">
      <h2>Your QR Code</h2>
      <img id="qr-image" alt="QR Code">
      <br>
      <a class="download-btn" id="download-btn" download="qrcode.png">Download PNG</a>
    </div>
  </div>

  <script>
    const form = document.getElementById('qr-form');
    const urlInput = document.getElementById('url');
    const submitBtn = document.getElementById('submit-btn');
    const qrResult = document.getElementById('qr-result');
    const qrImage = document.getElementById('qr-image');
    const downloadBtn = document.getElementById('download-btn');
    const errorDiv = document.getElementById('error');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const url = urlInput.value.trim();
      if (!url) return;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Generating...';
      errorDiv.classList.remove('show');
      qrResult.classList.remove('show');

      try {
        const response = await fetch('/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });

        const data = await response.json();

        if (data.error) {
          errorDiv.textContent = data.error;
          errorDiv.classList.add('show');
        } else {
          qrImage.src = data.qrCode;
          downloadBtn.href = data.qrCode;
          qrResult.classList.add('show');
        }
      } catch (err) {
        errorDiv.textContent = 'Failed to generate QR code. Please try again.';
        errorDiv.classList.add('show');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Generate QR Code';
      }
    });
  </script>
</body>
</html>`;

const server = serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === '/' && req.method === 'GET') {
      return new Response(HTML, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    if (url.pathname === '/generate' && req.method === 'POST') {
      try {
        const body = await req.json() as { url?: string };
        const inputUrl = body.url;

        if (!inputUrl) {
          return new Response(JSON.stringify({ error: 'URL is required' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 400
          });
        }

        const qrCodeDataUrl = await QRCode.toDataURL(inputUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        });

        return new Response(JSON.stringify({ qrCode: qrCodeDataUrl }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Failed to generate QR code' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 500
        });
      }
    }

    return new Response('Not Found', { status: 404 });
  }
});

console.log(`QR Code Generator running at http://localhost:${server.port}`);