import { useContext, useState, useRef, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { AppContext } from "../context/AppContext";
import './scanner.css';

export default function Scanner() {
  const { addPoints } = useContext(AppContext);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  // State for the two snacks
  const [initialSnackDetails, setInitialSnackDetails] = useState(null);
  const [alternativeSnackDetails, setAlternativeSnackDetails] = useState(null);
  // Renamed productDetails state
  const [currentLoadingSnack, setCurrentLoadingSnack] = useState(null); // 'initial' or 'alternative'
  const [isLoading, setIsLoading] = useState(false);

  // LLM States
  const [isSuggesting, setIsSuggesting] = useState(false); // Loading state for initial suggestions
  const [llmInitialSuggestions, setLlmInitialSuggestions] = useState(null); // State for initial suggestions
  const [isComparing, setIsComparing] = useState(false); // Loading state for comparison
  const [llmComparison, setLlmComparison] = useState(null); // State for comparison result
  const [modalInfo, setModalInfo] = useState({ visible: false, points: 0 }); // State for the points modal

  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const modalTimeoutRef = useRef(null); // Ref to manage modal timeout
  // State to manage the scanning flow
  const [scanStage, setScanStage] = useState('initial'); // 'initial', 'suggesting', 'initialScanned', 'alternative', 'comparing', 'compared'

  const VITE_OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

  const formatSnackData = (details) => {
    if (!details) return "N/A";
    const { name, product_name, nutriments = {}, ingredients_text } = details; // Added product_name for flexibility
    return `
Snack Name: ${product_name || name || "N/A"}
Calories (per 100g): ${nutriments['energy-kcal_100g'] || 'N/A'}
Sugars (per 100g): ${nutriments.sugars_100g || 'N/A'}
Fat (per 100g): ${nutriments.fat_100g || 'N/A'}
Sodium (per 100g): ${nutriments.sodium_100g || 'N/A'}
Ingredients: ${ingredients_text || "Ingredients not listed"}
    `.trim();
  };

  // New function for initial LLM suggestions
  const getLlmInitialSuggestions = async (initialDetails) => {
    if (!VITE_OPENROUTER_API_KEY) {
      setError("OpenRouter API key is not configured.");
      setScanStage('initial'); // Revert stage
      return;
    }
    if (!initialDetails) return;

    setIsSuggesting(true);
    setLlmInitialSuggestions(null);
    setError(null);
    setScanStage('suggesting');

    const systemPrompt = `You are a health assistant in a health tracking application that suggests healthier food alternatives.
You will be provided with the nutritional values (e.g., calories, sugar, fat) and ingredients of a product. The location of the user is the United States of America.

Your tasks are:
1. Analyze the provided nutritional values and ingredients.
2. Suggest three healthier alternatives that:
   - Have improved nutritional metrics (e.g., lower sugar, fewer calories, reduced saturated fat, less processed ingredients).
   - Are generally available in grocery stores within the United States.
3. Return your answer ONLY in the following structured format:

   - **Alternative 1:**
     - **Product Name:** [Name of the first alternative]
     - **Nutritional Benefits:** [E.g., '30% less sugar, 15% fewer calories']
     - **Price Difference:** [E.g., 'Similar price range', 'Slightly more expensive', 'Less expensive']

   - **Alternative 2:**
     - **Product Name:** [Name of the second alternative]
     - **Nutritional Benefits:** [E.g., '25% less saturated fat, 10% fewer calories']
     - **Price Difference:** [E.g., 'Similar price range', 'Slightly more expensive', 'Less expensive']

   - **Alternative 3:**
     - **Product Name:** [Name of the third alternative]
     - **Nutritional Benefits:** [E.g., '20% less sugar, 5% more fiber']
     - **Price Difference:** [E.g., 'Similar price range', 'Slightly more expensive', 'Less expensive']`;

    const userPrompt = `Here is the product data:
${formatSnackData(initialDetails)}`;

    console.log("Sending suggestions prompt to LLM:", userPrompt);

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
            { "role": "system", "content": systemPrompt },
            { "role": "user", "content": userPrompt }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`LLM API error! status: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log("LLM Suggestions Response:", data);

      if (data.choices && data.choices.length > 0) {
        setLlmInitialSuggestions(data.choices[0].message.content);
        setScanStage('initialScanned'); // Move to next stage after getting suggestions
      } else {
        throw new Error("No suggestions received from LLM.");
      }

    } catch (llmError) {
      console.error("Failed to get LLM suggestions:", llmError);
      setError(`Failed to get suggestions: ${llmError.message}`);
      setLlmInitialSuggestions(null);
      setScanStage('initial'); // Revert to initial stage on suggestion error
    } finally {
      setIsSuggesting(false);
    }
  };


  // New function for LLM comparison (remains largely the same)
  const getLlmComparison = async (initialDetails, alternativeDetails) => {
    if (!VITE_OPENROUTER_API_KEY) {
      setError("OpenRouter API key is not configured in .env file (VITE_OPENROUTER_API_KEY).");
      return;
    }
    if (!initialDetails || !alternativeDetails) return;

    setIsComparing(true);
    setLlmComparison(null);
    setError(null);
    setScanStage('comparing'); // Indicate comparison is in progress

    const prompt = `You are a health assistant in a health tracking application tasked with evaluating and comparing food products.

You will be provided with the nutritional values (e.g., calories, sugar, fat, sodium) and ingredients of two products: the initial product and a proposed alternative. The user's location is the United States of America.

Your tasks are:
1. Analyze and compare the nutritional values and ingredients of both products.
2. Determine which product is healthier, taking into account both:
   - How good it is for health in general (consider improved nutritional metrics such as lower sugar, fewer calories, reduced saturated fat, and less processed ingredients).
   - How it compares to the initial product.
   - Give more weightage to how good it is for health in general
   Compute a health score for each product on a scale from 1 to 10.
3. Assess the relevance of the proposed alternative to the initial product (e.g., similarity in product type and suitability for user preferences) on a scale from 1 to 10.
4. Compute a final composite score for the proposed alternative using a weight of 0.8 for the health score and 0.2 for the relevance score. (Final Points = (Health Score * 0.8) + (Relevance Score * 0.2))
5. Output only the following (do not include any additional text):

- **Healthier Product:** [Name]
- **Final Points:** [Score]
  
--- DATA ---
Initial Product Details:
${formatSnackData(initialDetails)}

Proposed Alternative Details:
${formatSnackData(alternativeDetails)}
`;

    console.log("Sending comparison prompt to LLM:", prompt);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${VITE_OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "meta-llama/llama-3.1-70b-instruct:free", // Or your preferred model
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
      console.log("LLM Comparison Success Response:", data);

      if (data.choices && data.choices.length > 0) {
        setLlmComparison(data.choices[0].message.content);
        setScanStage('compared'); // Comparison finished
      } else {
        throw new Error("No comparison received from LLM.");
      }

    } catch (llmError) {
      console.error("Failed to get LLM comparison:", llmError);
      setError(`Failed to get comparison: ${llmError.message}`);
      setLlmComparison(null);
      // Revert to a state where user can re-scan alternative or start over
      setScanStage('initialScanned');
    } finally {
      setIsComparing(false);
    }
  };


  // Modified function to fetch details
  const fetchProductDetails = async (barcode, stage) => {
    setIsLoading(true);
    setCurrentLoadingSnack(stage);
    setError(null);

    // Clear relevant state based on the stage being fetched
    if (stage === 'initial') {
        setInitialSnackDetails(null);
        setAlternativeSnackDetails(null);
        setLlmInitialSuggestions(null); // Clear suggestions
        setLlmComparison(null); // Clear comparison
    } else { // stage === 'alternative'
        setAlternativeSnackDetails(null);
        setLlmComparison(null); // Clear comparison
    }

    console.log(`Fetching details for ${stage} snack, barcode: ${barcode}`);
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
      );
      if (!response.ok) {
          if (response.status === 404) {
             throw new Error(`Product with barcode ${barcode} not found in Open Food Facts database.`);
          }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("API Response:", data);

      if (data.status === 1 && data.product) {
        const product = data.product;
        const details = product;

        if (stage === 'initial') {
          setInitialSnackDetails(details);
          // Instead of changing stage, trigger suggestions fetch
          getLlmInitialSuggestions(details);
        } else if (stage === 'alternative') {
          setAlternativeSnackDetails(details);
          // Comparison is triggered by useEffect watching alternativeSnackDetails
          // No stage change needed here, useEffect handles it
        }
      } else {
        throw new Error(data.status_verbose || "Product not found or invalid response");
      }
    } catch (fetchError) {
      console.error(`Failed to fetch ${stage} product details:`, fetchError);
      setError(`Failed to fetch ${stage} details: ${fetchError.message}`);
      // Reset stage appropriately on fetch error
      if (stage === 'initial') {
          setScanStage('initial');
      } else {
          // If fetching alternative fails, go back to the state where initial suggestions are shown
          setScanStage('initialScanned');
      }
    } finally {
      setIsLoading(false);
      setCurrentLoadingSnack(null);
    }
  };

  // useEffect to trigger comparison (remains the same)
  useEffect(() => {
    if (initialSnackDetails && alternativeSnackDetails && scanStage !== 'comparing' && scanStage !== 'compared') {
      getLlmComparison(initialSnackDetails, alternativeSnackDetails);
    }
  }, [initialSnackDetails, alternativeSnackDetails, scanStage]); // Added scanStage to dependencies


  // handleScanSuccess remains the same
  const handleScanSuccess = (decodedText, decodedResult) => {
    console.log(`✅ Scanned barcode (${scanStage}):`, decodedText);
    stopScanner().then(() => {
        // Fetch details for the *current* intended stage
        if (scanStage === 'initial' || scanStage === 'suggesting') {
            fetchProductDetails(decodedText, 'initial');
        } else if (scanStage === 'alternative' || scanStage === 'initialScanned') {
            // Allow scanning alternative only if initial scan/suggestion is done
            fetchProductDetails(decodedText, 'alternative');
        }
    });
  };

  // Cleanup useEffect remains the same
  useEffect(() => {
    const html5QrCode = html5QrCodeRef.current;
    return () => {
        stopScanner(); // Use the helper function for cleanup
    };
  }, []);

  // stopScanner remains the same
  const stopScanner = async () => {
      const html5QrCode = html5QrCodeRef.current;
      if (html5QrCode && typeof html5QrCode.stop === 'function' && html5QrCode.getState() === 2 /* SCANNING */) {
          try {
              await html5QrCode.stop();
              console.log("Scanner stopped successfully.");
              setScanning(false);
          } catch (err) {
              console.error("Error stopping scanner:", err);
              setScanning(false);
          }
      } else {
         setScanning(false);
      }
  };


  // Modified startScanner to set the correct stage *before* starting hardware
  const startScanner = async (stageToScan) => {
    await stopScanner();

    // Set the intended stage *before* trying to start the scanner
    setScanStage(stageToScan);

    setScanning(true);
    setError(null);

    // Clear relevant state when initiating a scan stage
    if (stageToScan === 'initial') {
        setInitialSnackDetails(null);
        setAlternativeSnackDetails(null);
        setLlmInitialSuggestions(null);
        setLlmComparison(null);
    } else if (stageToScan === 'alternative') {
        // Only clear alternative details and comparison if starting alternative scan
        setAlternativeSnackDetails(null);
        setLlmComparison(null);
    }

    const scannerElement = document.getElementById("scanner");
    if (!scannerElement) {
      setError("Scanner UI element not found in the DOM.");
      setScanning(false);
      return;
    }

    let html5QrCode = html5QrCodeRef.current;
    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode("scanner", {
          experimentalFeatures: {
              useBarCodeDetectorIfSupported: true,
          },
          verbose: false
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
            console.warn("Scanner was already running, attempting to stop before restarting.");
           await html5QrCode.stop();
        }

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        handleScanSuccess,
        (scanError) => { /* Ignore */ }
      );
      console.log(`Scanner started for ${stageToScan} snack.`);
    } catch (err) {
        let errorMessage = `Failed to start camera: ${err.message}.`;
        if (err.name === 'NotAllowedError') {
            errorMessage += ' Please grant camera permission.';
        } else if (err.name === 'NotFoundError') {
             errorMessage += ' No suitable camera found or camera is busy.';
        } else {
             errorMessage += ' Check browser support or other issues.';
        }
        setError(errorMessage);
        console.error("Scanner init error:", err);
        setScanning(false);
        // Revert to previous stable state on error
        if (stageToScan === 'alternative') {
            setScanStage('initialScanned');
        } else {
            setScanStage('initial');
        }
        // Attempt cleanup
        if (html5QrCode && typeof html5QrCode.getState === 'function' && html5QrCode.getState() === 2) {
            html5QrCode.stop().catch(e => console.error("Cleanup stop failed after start error", e));
        }
    }
  };

  // Function to format LLM response (simple preformatting)
  const formatLlmResponse = (text) => {
      if (!text) return null;
      // Replace markdown-like bolding with <strong> tags
      let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Replace both escaped (\n) and literal (\n) newlines with <br /> tags using a single regex
      formattedText = formattedText.replace(/\\n|\n/g, '<br />');
      return formattedText;
  };

  // SnackDisplay remains the same
  const SnackDisplay = ({ snack, title }) => {
      if (!snack) return null;
      const { product_name, image_url, nutriments = {}, ingredients_text } = snack;
      return (
          <div className="" style={{ marginTop: "1rem", padding: "1rem",borderRadius: "15px", maxWidth: '510px', marginRight: '10px', textAlign: 'center', background: '#f9f9f9' , padding: '10px', color: '#000000', backgroundColor: '#cccfcd'}}>
              <h3 style={{ fontFamily: 'Urbanist, sans-serif' }}>{product_name || "Name not found"}</h3>
              {image_url && (
                  <img
                      src={image_url}
                      alt={product_name || 'Snack image'}
                      style={{ maxWidth: "150px", height: "auto", marginBottom: "1rem", display: 'block', marginLeft: 'auto', marginRight: 'auto', borderRadius: '10px' }}
                  />
              )}
              <p style={{ color: 'black' }}><strong>Calories:</strong> {nutriments['energy-kcal_100g'] !== undefined ? `${nutriments['energy-kcal_100g']} kcal / 100g` : 'N/A'}</p>
              <p style={{ color: 'black' }}><strong>Sugars:</strong> {nutriments.sugars_100g !== undefined ? `${nutriments.sugars_100g} g / 100g` : 'N/A'}</p>
              <p style={{ color: 'black' }}><strong>Fat:</strong> {nutriments.fat_100g !== undefined ? `${nutriments.fat_100g} g / 100g` : 'N/A'}</p>
              <p style={{ color: 'black' }}><strong>Sodium:</strong> {nutriments.sodium_100g !== undefined ? `${(nutriments.sodium_100g * 1000).toFixed(0)} mg / 100g` : 'N/A'}</p>
              <p style={{ color: 'black' }}><strong>Ingredients:</strong> {ingredients_text || "Ingredients not listed"}</p>
          </div>
      );
  };


  // Function to reset the entire flow
  const resetFlow = () => {
      stopScanner();
      setScanStage('initial');
      setInitialSnackDetails(null);
      setAlternativeSnackDetails(null);
      setLlmInitialSuggestions(null);
      setLlmComparison(null);
      setError(null);
      setIsLoading(false);
      setIsSuggesting(false);
      setIsComparing(false);
      setCurrentLoadingSnack(null);
  };

  // useEffect to parse LLM comparison and show points alert
  useEffect(() => {
    if (scanStage === 'compared' && llmComparison) {
      console.log("Attempting to parse LLM comparison for points:", llmComparison);
      // Regex to find 'Final Points:' with optional leading characters/markdown and case-insensitivity
      const pointsRegex = /-?\s*\*?\*?Final Points:\*?\*?\s*(\d+(\.\d+)?)/i;
      const match = llmComparison.match(pointsRegex);

      if (match && match[1]) {
        const score = parseFloat(match[1]);
        if (!isNaN(score)) {
          console.log(`Extracted score: ${score}`);
          
          // Clear any existing timeout before setting a new one
          if (modalTimeoutRef.current) {
            clearTimeout(modalTimeoutRef.current);
          }
          
          // Show the modal with the score
          setModalInfo({ visible: true, points: score });
          addPoints(score);

          // Set a timeout to hide the modal after 4 seconds
          modalTimeoutRef.current = setTimeout(() => {
            setModalInfo({ visible: false, points: 0 });
            modalTimeoutRef.current = null; // Clear the ref
          }, 4000);

        } else {
          console.error("Failed to parse extracted score as a number:", match[1]);
        }
      } else {
        console.warn("Could not find 'Final Points:' in the LLM comparison string or format is unexpected.");
      }
    }
  }, [llmComparison, scanStage]); // Depend on llmComparison and scanStage

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (modalTimeoutRef.current) {
        clearTimeout(modalTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "2rem", paddingBottom: "3rem" }}>

      {/* --- Control Buttons --- */}
      {!scanning && scanStage === 'initial' && (
        <button onClick={() => startScanner('initial')} style={{ padding: "0.8rem 1.5rem", marginBottom: '1rem', fontSize: '1rem' }}>
          Scan Snack
        </button>
      )}
      {/* Show Scan Alternative button only after initial suggestions are loaded */}
      {!scanning && scanStage === 'initialScanned' && initialSnackDetails && (
      <button
      onClick={() => startScanner('alternative')}
      style={{
        padding: "0.8rem 1.5rem",
        marginBottom: '1rem',
        fontSize: '1rem',
        backgroundColor: '#2f7a45',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = '#ffffff';
        e.target.style.color = '#2f7a45';
        e.target.style.border = '1px solid #2f7a45';
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = '#2f7a45';
        e.target.style.color = 'white';
        e.target.style.border = 'none';
      }}
    >
      Scan Healthier Alternative
    </button>
    
      
      
      )}
       {/* Show Start Over button after comparison or if stuck */}
       {!scanning && (scanStage === 'compared' || scanStage === 'initialScanned' || scanStage === 'alternative') && (
        <button
        onClick={resetFlow}
        style={{
          padding: "0.8rem 1.5rem",
          marginBottom: '1rem',
          marginLeft: '1rem',
          fontSize: '1rem',
          backgroundColor: '#f5f2eb',
          color: '#2f7a45',
          border: '1px solid #2f7a45',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#2f7a45';
          e.target.style.color = '#ffffff';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#f5f2eb';
          e.target.style.color = '#2f7a45';
        }}
      >
        Start New Comparison
      </button>
      
      
      
       )}
       {/* Add Stop Scan button when scanning is active */}
       {scanning && (
          <button onClick={stopScanner} style={{ padding: "0.8rem 1.5rem", marginBottom: '1rem', fontSize: '1rem', backgroundColor: '#ffff', color: 'red' }}>
             Stop Scan
          </button>
        )}


       {/* --- Scanner UI --- */}
       <div
         id="scanner"
         ref={scannerRef}
         style={{
           width: "300px",
           height: "300px",
           margin: "1rem auto",
           border: scanning ? "3px solid lightgreen" : "2px dashed #ccc",
           borderRadius: '8px',
           backgroundColor: "#f8f8f8",
           display: scanning ? "block" : "none",
           position: "relative",
           overflow: 'hidden'
         }}
       >
         {scanning && <p style={{position: 'absolute', top: '5px', left: '5px', color: '#555', fontSize: '1em'}}>Scanning for {scanStage} snack...</p>}
       </div>

      {/* --- Status Messages --- */}
      {isLoading && <p>Loading details for {currentLoadingSnack} snack...</p>}
      {isSuggesting && <p style={{ marginTop: '1rem', fontStyle: 'italic' }}>Getting initial suggestions...</p>}
      {isComparing && <p style={{ marginTop: '1rem', fontStyle: 'italic' }}>Comparing snacks...</p>}
      {error && <p style={{ color: "red", marginTop: '1rem', fontWeight: 'bold' }}>Error: {error}</p>}


      {/* --- Snack Display Area (Flex Container) --- */}
      <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', marginTop: '1rem' }}>
        {/* Initial Snack Display */}
        {initialSnackDetails && <SnackDisplay snack={initialSnackDetails} title="Initial Snack" />}

        {/* Alternative Snack Display (conditionally rendered) */}
        {alternativeSnackDetails && (scanStage === 'alternative' || scanStage === 'comparing' || scanStage === 'compared') && (
            <SnackDisplay snack={alternativeSnackDetails} title="Alternative Snack" />
        )}
      </div>

      {/* --- Initial Suggestions Area --- */}
      {llmInitialSuggestions && !isSuggesting && (scanStage === 'initialScanned' || scanStage === 'alternative' || scanStage === 'comparing') && (
          <div style={{
            margin: '2rem auto',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            maxWidth: '700px',
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
            color: '#111827',
            fontFamily: 'sans-serif',
          }}>
            <h4 style={{
              textAlign: 'center',
              marginBottom: '1.25rem',
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#1f2937'
            }}>
              Suggested Alternatives
            </h4>
          
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}>
              {formatLlmResponse(llmInitialSuggestions).split('<br>').map((item, index) => (
                <div key={index} style={{
                  backgroundColor: '#ffffff',
                  borderLeft: '4px solid #3b82f6',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  lineHeight: '1.5',
                  fontSize: '0.95rem',
                }} dangerouslySetInnerHTML={{ __html: item.trim() }} />
              ))}
            </div>
          </div>
          
          
      )}

      {/* --- LLM Comparison Result --- */}
      {llmComparison && !isComparing && scanStage === 'compared' && (
        <div style={{
          margin: '2rem auto',
          padding: '1.5rem',
          border: '1px solid #e5e7eb',
          borderRadius: '0.75rem',
          maxWidth: '700px',
          backgroundColor: '#f9fafb',
          color: '#111827',
          fontFamily: 'sans-serif',
          boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
        }}>
          <h3 style={{
            textAlign: 'center',
            marginBottom: '1.25rem',
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            Comparison Result
          </h3>
        
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            lineHeight: '1.6',
            fontSize: '0.95rem',
          }}>
            {formatLlmResponse(llmComparison).split('<br>').map((chunk, index) => (
              <div key={index} style={{
                backgroundColor: '#ffffff',
                borderLeft: '4px solid #10b981', // a nice emerald/green vibe for comparisons
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
              }} dangerouslySetInnerHTML={{ __html: chunk.trim() }} />
            ))}
          </div>
        </div>
        
      )}

      {/* --- Points Earned Modal --- */}
      {modalInfo.visible && (
        <div style={{
          position: 'fixed', // Position relative to the viewport
          top: '20px',       // Position from the top
          left: '50%',      // Center horizontally
          transform: 'translateX(-50%)', // Adjust for centering
          backgroundColor: 'rgba(40, 40, 40, 0.9)', // Semi-transparent dark background
          color: '#66ff66',  // Bright green text
          padding: '10px 20px', // Make padding smaller
          borderRadius: '20px', // Make borders more rounded
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)', // Subtle shadow
          zIndex: 1000,       // Ensure it's on top
          fontSize: '0.8em',   // Make font slightly smaller
          fontWeight: 'bold',
          fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', // Modern font
          transition: 'opacity 0.5s ease-out', // Smooth fade out (though we hide abruptly)
          textAlign: 'center'
        }}>
          {modalInfo.points.toFixed(1)} Points Added!
        </div>
      )}

    </div>
  );
}
