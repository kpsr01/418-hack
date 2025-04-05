import { useContext, useState, useRef, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { AppContext } from "../context/AppContext";

export default function Scanner() {
  const { setScanResult } = useContext(AppContext);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [productDetails, setProductDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  const fetchProductDetails = async (barcode) => {
    setIsLoading(true);
    setError(null);
    setProductDetails(null);
    console.log(`Fetching details for barcode: ${barcode}`);
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("API Response:", data);

      if (data.status === 1 && data.product) {
        const product = data.product;
        setProductDetails({
          name: product.product_name || "Name not found",
          imageUrl: product.image_url || null,
          nutriments: product.nutriments || {},
          ingredients: product.ingredients_text || "Ingredients not listed",
        });
      } else {
        throw new Error(data.status_verbose || "Product not found");
      }
    } catch (fetchError) {
      console.error("Failed to fetch product details:", fetchError);
      setError(`Failed to fetch details: ${fetchError.message}`);
      setProductDetails(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanSuccess = (decodedText, decodedResult) => {
    console.log("✅ Scanned barcode:", decodedText);
    html5QrCodeRef.current
      ?.stop()
      .then(() => {
        console.log("Scanner stopped after scan");
        setScanning(false);
        fetchProductDetails(decodedText);
      })
      .catch((err) => {
        console.error("Error stopping scanner:", err);
        setScanning(false);
        fetchProductDetails(decodedText);
      });
  };

  useEffect(() => {
    const html5QrCode = html5QrCodeRef.current;
    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop()
          .then(() => console.log("Scanner stopped on component unmount"))
          .catch(err => console.error("Error stopping scanner on unmount:", err));
      }
    };
  }, []);

  const startScanner = async () => {
    setScanning(true);
    setError(null);
    setProductDetails(null);

    const scannerElement = document.getElementById("scanner");
    if (!scannerElement) {
      setError("Scanner element not found in the DOM.");
      setScanning(false);
      return;
    }

    let html5QrCode = html5QrCodeRef.current;
    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("scanner", {
            experimentalFeatures: {
                useBarCodeDetectorIfSupported: true,
            },
        });
        html5QrCodeRef.current = html5QrCode;
    }

    const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
    };

    try {
      if (html5QrCode.isScanning) {
           await html5QrCode.stop();
       }

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        handleScanSuccess,
        (scanError) => {
        }
      );
      console.log("Scanner started successfully.");
    } catch (err) {
      setError(`Failed to start camera: ${err.message}. Check permissions or browser support.`);
      console.error("Scanner init error:", err);
      setScanning(false);
       if (html5QrCode && html5QrCode.isScanning) {
            html5QrCode.stop().catch(e => console.error("Cleanup stop failed", e));
       }
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "2rem" }}>
      {!scanning && !productDetails && (
        <button onClick={startScanner} style={{ padding: "0.5rem 1rem", marginBottom: '1rem' }}>
          Start Barcode Scan
        </button>
      )}

       <div
         id="scanner"
         ref={scannerRef}
         style={{
           width: "320px",
           height: "320px",
           margin: "1rem auto",
           border: scanning ? "2px solid lightgreen" : "2px dashed #ccc",
           backgroundColor: "#f0f0f0",
           display: scanning ? "block" : "none",
           position: "relative"
         }}
       >
       </div>

      {isLoading && <p>Loading product details...</p>}
      {error && <p style={{ color: "red", marginTop: '1rem' }}>{error}</p>}

      {productDetails && (
        <div style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #eee", borderRadius: "8px", maxWidth: '400px', margin: '1rem auto' }}>
          <h3>{productDetails.name}</h3>
          {productDetails.imageUrl && (
            <img
              src={productDetails.imageUrl}
              alt={productDetails.name}
              style={{ maxWidth: "150px", height: "auto", marginBottom: "1rem" }}
            />
          )}
          <p><strong>Calories:</strong> {productDetails.nutriments['energy-kcal_100g'] || 'N/A'} kcal per 100g</p>
          <p><strong>Sugars:</strong> {productDetails.nutriments.sugars_100g || 'N/A'}g per 100g</p>
          <p><strong>Fat:</strong> {productDetails.nutriments.fat_100g || 'N/A'}g per 100g</p>
          <p><strong>Ingredients:</strong> {productDetails.ingredients}</p>
           <button onClick={startScanner} style={{ padding: "0.5rem 1rem", marginTop: '1rem' }}>
             Scan Another Item
           </button>
        </div>
      )}
    </div>
  );
}
