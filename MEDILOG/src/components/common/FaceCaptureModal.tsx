import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";

// 👇 DITO ANG MAGIC FIX:
// Ginagawa nating 'any' ang Webcam component mismo para ignorahin ng TypeScript ang strict rules nito.
const WebcamComponent = Webcam as any;

interface FaceCaptureModalProps {
  show: boolean;
  onClose: () => void;
  onCapture: (imageBlob: Blob) => void;
}

const FaceCaptureModal: React.FC<FaceCaptureModalProps> = ({
  show,
  onClose,
  onCapture,
}) => {
  // Ref is now purely 'any' to avoid conflicts
  const webcamRef = useRef<any>(null);

  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string>("");

  // Load models from CDN
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL =
          "https://justadudewhohacks.github.io/face-api.js/models";
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        setIsModelLoaded(true);
        setError("");
      } catch (error) {
        console.error("Error loading models:", error);
        setError("Hindi ma-load ang AI. Check your internet connection.");
      }
    };

    if (show) {
      loadModels();
    }
  }, [show]);

  // Reset states when modal closes
  useEffect(() => {
    if (!show) {
      setCameraReady(false);
      setDetecting(false);
      setError("");
    }
  }, [show]);

  const dataURItoBlob = (dataURI: string): Blob => {
    const byteString = atob(dataURI.split(",")[1]);
    const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  const captureAndDetect = async () => {
    if (!webcamRef.current || !isModelLoaded) {
      setError("Camera or AI model not ready");
      return;
    }

    setDetecting(true);
    setError("");

    try {
      // Get screenshot
      const imageSrc = webcamRef.current.getScreenshot();

      if (!imageSrc) {
        setError("Failed to capture image");
        setDetecting(false);
        return;
      }

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageSrc;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
      });

      // Detect Face
      const detections = await faceapi.detectSingleFace(
        img,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 512,
          scoreThreshold: 0.5,
        })
      );

      if (detections) {
        const blob = dataURItoBlob(imageSrc);
        onCapture(blob);
        onClose();
      } else {
        setError(
          "Walang mukha na na-detect! Pakialis ang mask o ayusin ang ilaw."
        );
      }
    } catch (error) {
      console.error("Error during face detection:", error);
      setError("Error sa pag-scan. Subukan ulit.");
    } finally {
      setDetecting(false);
    }
  };

  const handleCameraError = () => {
    console.error("Camera error");
    setError("Hindi ma-access ang camera. Check permissions.");
  };

  if (!show) return null;

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.8)", zIndex: 1055 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content rounded-4 overflow-hidden">
          <div className="modal-header bg-success text-white">
            <h5 className="modal-title">📸 Take Photo Verification</h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>

          <div
            className="modal-body p-0 bg-black text-center position-relative"
            style={{ minHeight: "400px" }}
          >
            {error && (
              <div className="alert alert-danger m-3 mb-0" role="alert">
                {error}
              </div>
            )}

            {!isModelLoaded && !error && (
              <div className="d-flex flex-column justify-content-center align-items-center h-100 text-white p-5">
                <div className="spinner-border text-success mb-3" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mb-0">Connecting to AI...</p>
                <small className="text-muted">
                  This may take a few seconds
                </small>
              </div>
            )}

            {isModelLoaded && !error && (
              <div className="position-relative">
                {/* 👇 GINAMIT NATIN YUNG 'WebcamComponent' variable DITO */}
                <WebcamComponent
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    facingMode: "user",
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                  }}
                  mirrored={true}
                  style={{ width: "100%", height: "auto", display: "block" }}
                  onUserMedia={() => setCameraReady(true)}
                  onUserMediaError={handleCameraError}
                />

                {cameraReady && (
                  <>
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "220px",
                        height: "280px",
                        border: "3px dashed rgba(255,255,255,0.8)",
                        borderRadius: "50%",
                        pointerEvents: "none",
                        boxShadow: "0 0 0 9999px rgba(0,0,0,0.3)",
                      }}
                    ></div>
                    <div
                      className="position-absolute bottom-0 start-0 end-0 text-white p-3"
                      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
                    >
                      <small>Position your face inside the oval</small>
                    </div>
                  </>
                )}

                {detecting && (
                  <div
                    className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
                  >
                    <div className="text-white text-center">
                      <div
                        className="spinner-border text-success mb-2"
                        role="status"
                      ></div>
                      <p className="mb-0">Scanning face...</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer justify-content-between">
            <button
              type="button"
              className="btn btn-secondary rounded-pill px-4"
              onClick={onClose}
              disabled={detecting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-success rounded-pill fw-bold px-4"
              onClick={captureAndDetect}
              disabled={!cameraReady || detecting || !isModelLoaded}
            >
              {detecting ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  ></span>
                  Scanning...
                </>
              ) : (
                <>
                  <i className="bi bi-camera me-2"></i>
                  Capture Photo
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceCaptureModal;
