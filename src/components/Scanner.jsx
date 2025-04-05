import { useContext, useState, useRef, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { AppContext } from "../context/AppContext";

export default function Scanner() {
  const { setScanResult } = useContext(AppContext);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [productDetails, setProductDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [llmAnalysis, setLlmAnalysis] = useState(null);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  const VITE_OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

  const getLlmAnalysis = async (details) => {
    if (!VITE_OPENROUTER_API_KEY) {
      setError("OpenRouter API key is not configured in .env file (VITE_OPENROUTER_API_KEY).");
      return;
    }
    if (!details) return;

    setIsAnalyzing(true);
    setLlmAnalysis(null);
    setError(null);

    const { name, nutriments, ingredients } = details;
    const prompt = `Analyze the following snack food based on its nutritional information and ingredients. Provide a brief healthiness summary (1-2 sentences) and suggest 1-2 specific, healthier alternatives available in typical grocery stores. Focus on lower sugar and processed ingredients.

Snack Name: ${name}
Calories (per 100g): ${nutriments['energy-kcal_100g'] || 'N/A'}
Sugars (per 100g): ${nutriments.sugars_100g || 'N/A'}
Fat (per 100g): ${nutriments.fat_100g || 'N/A'}
Ingredients: ${ingredients}

Analysis and Alternatives:`;

    console.log("Sending prompt to LLM:", prompt);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${VITE_OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "meta-llama/llama-3.1-70b-instruct:free",
          "messages": [
            { "role": "user", "content": prompt }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("LLM API Error Response:", errorData);
        throw new Error(`LLM API error! status: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log("LLM API Success Response:", data);

      if (data.choices && data.choices.length > 0) {
        setLlmAnalysis(data.choices[0].message.content);
      } else {
        throw new Error("No analysis received from LLM.");
      }

    } catch (llmError) {
      console.error("Failed to get LLM analysis:", llmError);
      setError(`Failed to get analysis: ${llmError.message}`);
      setLlmAnalysis(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fetchProductDetails = async (barcode) => {
    setIsLoading(true);
    setError(null);
    setProductDetails(null);
    setLlmAnalysis(null);
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
        const details = {
          name: product.product_name || "Name not found",
          imageUrl: product.image_url || null,
          nutriments: product.nutriments || {},
          ingredients: product.ingredients_text || "Ingredients not listed",
        };
        setProductDetails(details);
        await getLlmAnalysis(details);
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
      if (html5QrCode && typeof html5QrCode.stop === 'function' && html5QrCode.getState() === 2) {
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
    setLlmAnalysis(null);

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
      if (html5QrCode && typeof html5QrCode.getState === 'function' && html5QrCode.getState() === 2) {
           await html5QrCode.stop();
           console.log("Stopped existing scanner session before starting new one.");
       }

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        handleScanSuccess,
        (scanError) => { /* Optional ignore */ }
      );
      console.log("Scanner started successfully.");
    } catch (err) {
      setError(`Failed to start camera: ${err.message}. Check permissions or browser support.`);
      console.error("Scanner init error:", err);
      setScanning(false);
       if (html5QrCode && typeof html5QrCode.getState === 'function' && html5QrCode.getState() === 2) {
            html5QrCode.stop().catch(e => console.error("Cleanup stop failed after start error", e));
       }
    }
  };

  const formatLlmResponse = (text) => {
    if (!text) return null;
    return text.split('\\n').join('<br />');
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
      {error && !isAnalyzing && <p style={{ color: "red", marginTop: '1rem' }}>{error}</p>}

      {productDetails && !isLoading && (
        <div style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #eee", borderRadius: "8px", maxWidth: '500px', margin: '1rem auto', textAlign: 'left' }}>
          <h3>{productDetails.name}</h3>
          {productDetails.imageUrl && (
            <img
              src={productDetails.imageUrl}
              alt={productDetails.name}
              style={{ maxWidth: "150px", height: "auto", marginBottom: "1rem", display: 'block', marginLeft: 'auto', marginRight: 'auto' }}
            />
          )}
          <p><strong>Calories:</strong> {productDetails.nutriments['energy-kcal_100g'] || 'N/A'} kcal / 100g</p>
          <p><strong>Sugars:</strong> {productDetails.nutriments.sugars_100g || 'N/A'} g / 100g</p>
          <p><strong>Fat:</strong> {productDetails.nutriments.fat_100g || 'N/A'} g / 100g</p>
          <p><strong>Ingredients:</strong> {productDetails.ingredients}</p>

          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
            <h4>AI Analysis & Alternatives:</h4>
            {isAnalyzing && <p>Analyzing...</p>}
            {error && isAnalyzing && <p style={{ color: "orange", marginTop: '1rem' }}>{error}</p>}

            {llmAnalysis && !isAnalyzing && (
              <p dangerouslySetInnerHTML={{ __html: formatLlmResponse(llmAnalysis) }} />
            )}
             {!llmAnalysis && !isAnalyzing && !error && productDetails && (
                 <p>Waiting for analysis...</p>
             )}
          </div>

           <button onClick={startScanner} style={{ padding: "0.5rem 1rem", marginTop: '1rem', display: 'block', marginLeft: 'auto', marginRight: 'auto' }}>
             Scan Another Item
           </button>
        </div>
      )}
    </div>
  );
}
