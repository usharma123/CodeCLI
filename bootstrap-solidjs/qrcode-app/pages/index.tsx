import { useState } from "react";
import Head from "next/head";
import { QRCodeSVG } from "qrcode.react";
import styles from "@/styles/Home.module.css";

export default function Home() {
  const [url, setUrl] = useState("");
  const [qrSize, setQrSize] = useState(200);

  return (
    <>
      <Head>
        <title>QR Code Generator</title>
        <meta name="description" content="Generate QR codes for any URL" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className={styles.container}>
        <main className={styles.main}>
          <h1 className={styles.title}>QR Code Generator</h1>
          <p className={styles.subtitle}>
            Paste any link below to generate a QR code
          </p>

          <div className={styles.inputGroup}>
            <input
              type="url"
              placeholder="Enter your URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.controls}>
            <label className={styles.label}>
              QR Code Size:
              <input
                type="range"
                min="100"
                max="400"
                step="50"
                value={qrSize}
                onChange={(e) => setQrSize(Number(e.target.value))}
                className={styles.slider}
              />
              <span className={styles.sizeValue}>{qrSize}px</span>
            </label>
          </div>

          <div className={styles.qrContainer}>
            {url ? (
              <div className={styles.qrWrapper}>
                <QRCodeSVG
                  value={url}
                  size={qrSize}
                  level="H"
                  includeMargin={true}
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
            ) : (
              <div className={styles.placeholder}>
                <span>Enter a URL to generate QR code</span>
              </div>
            )}
          </div>

          {url && (
            <p className={styles.hint}>
              Tip: Right-click the QR code and save as image
            </p>
          )}
        </main>
      </div>
    </>
  );
}
