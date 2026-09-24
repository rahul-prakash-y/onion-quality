import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Camera, 
  Upload, 
  MapPin, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  ChevronDown, 
  Scan,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  CameraOff
} from 'lucide-react';
import { useInspection } from '../context/InspectionContext';
import { useTranslation } from 'react-i18next';
import { GeographicRegion, SamplePreset } from '../types';
import { SAMPLE_PRESETS } from '../data/mockData';
import { uploadInspectionImage, dataURLtoBlob } from '../services/api';

export const InspectionCapture: React.FC = () => {
  const { t } = useTranslation();
  const { 
    selectedRegion, 
    setSelectedRegion, 
    currentBatchId, 
    activePreset, 
    setActivePreset, 
    capturedImage, 
    setCapturedImage, 
    setActiveDetections, 
    inspectionStep, 
    analyzingStepIndex, 
    startAnalysisFlow
  } = useInspection();

  // Media & Input References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Viewfinder & State Management
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isLoadingCamera, setIsLoadingCamera] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<{
    type: 'NotAllowedError' | 'NotFoundError' | 'OverconstrainedError' | 'General';
    message: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const geographicProfiles: Record<GeographicRegion, { variety: string; mandi: string; desc: string }> = {
    'Maharashtra': { 
      variety: 'Bhima Super (Nashik Red)', 
      mandi: 'Lasalgaon / Pimpalgaon APMC', 
      desc: 'High firmness, intense ruby color, premium 55mm+ export caliber' 
    },
    'Madhya Pradesh': { 
      variety: 'Malwa Red Globe', 
      mandi: 'Indore / Mandsaur Mandi', 
      desc: 'Medium pungency, spherical, favorable storage longevity' 
    },
    'Karnataka': { 
      variety: 'Kurnool / Bellary Pink', 
      mandi: 'Hubballi / Yeshwantpur APMC', 
      desc: 'Mild sweetness, pink scales, early kharif arrival' 
    },
    'Gujarat': { 
      variety: 'Mahuva White / Saurashtra Red', 
      mandi: 'Mahuva / Gondal Mandi', 
      desc: 'High solids, dehydrated flakes benchmark, export standard' 
    },
    'Rajasthan': { 
      variety: 'Alwar Dark Red', 
      mandi: 'Alwar / Kota Mandi', 
      desc: 'Deep crimson scales, late winter harvest, firm core' 
    }
  };

  /**
   * Stops all active camera stream tracks safely
   */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping camera track:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  /**
   * Initializes mobile camera with explicit facingMode: { exact: "environment" } constraint
   * with robust fallback for non-mobile testing and explicit error mapping.
   */
  const startCamera = useCallback(async () => {
    if (capturedImage) return;

    stopCamera();
    setIsLoadingCamera(true);
    setCameraError(null);

    // Verify browser support
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError({
        type: 'NotFoundError',
        message: 'Camera API (navigator.mediaDevices.getUserMedia) is not supported in this browser environment.'
      });
      setIsLoadingCamera(false);
      return;
    }

    try {
      // Mobile Specifics: Configure camera constraint to explicitly request rear-facing/environment camera
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { exact: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });
      } catch (exactErr: any) {
        // If exact "environment" constraint throws OverconstrainedError or NotFoundError (e.g. desktop/laptop test environments)
        // gracefully attempt fallback with ideal environment facingMode or general video input
        if (
          exactErr.name === 'OverconstrainedError' || 
          exactErr.name === 'ConstraintNotSatisfiedError'
        ) {
          console.warn('Mobile exact: "environment" constraint unavailable, attempting fallback:', exactErr);
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'environment',
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            },
            audio: false
          });
        } else {
          throw exactErr;
        }
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((e) => console.warn('Video auto-play prevented:', e));
          setIsStreaming(true);
          setIsLoadingCamera(false);
        };
      } else {
        setIsStreaming(true);
        setIsLoadingCamera(false);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setIsLoadingCamera(false);
      setIsStreaming(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError({
          type: 'NotAllowedError',
          message: 'Camera permission denied. Please allow camera permissions in your browser or use the native camera fallback below.'
        });
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError({
          type: 'NotFoundError',
          message: 'No camera hardware found on this device. Please use the fallback controls below.'
        });
      } else {
        setCameraError({
          type: 'General',
          message: err.message || 'Unable to open camera viewfinder. Please use the native camera fallback below.'
        });
      }
    }
  }, [capturedImage, stopCamera]);

  // Lifecycle: open camera when entering capture screen; clean up tracks on unmount
  useEffect(() => {
    if (!capturedImage && inspectionStep === 'capture') {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [capturedImage, inspectionStep, startCamera, stopCamera]);

  /**
   * Captures the current live video frame as high-resolution base64 dataURL & JPEG Blob
   */
  const captureFrame = async (): Promise<{ blob: Blob; dataUrl: string } | null> => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      return null;
    }

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Draw full resolution frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.95);
    });

    const finalBlob = blob || dataURLtoBlob(dataUrl);
    return { blob: finalBlob, dataUrl };
  };

  /**
   * Upload Wiring: Immediately pass the real image Blob to uploadInspectionImage(blob)
   * sending it directly to FastAPI backend and bypassing the mock data flow completely.
   */
  const uploadAndAnalyze = async (blob: Blob, previewUrl?: string) => {
    if (previewUrl) {
      setCapturedImage(previewUrl);
    }
    stopCamera();
    setIsProcessing(true);

    try {
      // 1. Immediately pass image Blob to FastAPI backend POST /api/v1/inspect/upload
      const uploadRes = await uploadInspectionImage(blob, {
        batchId: currentBatchId,
        region: selectedRegion,
        variety: geographicProfiles[selectedRegion]?.variety || activePreset.variety,
        farmerName: activePreset.farmerName || 'Rameshwar Patil',
        presetHint: activePreset.id,
      });

      const serverInspectionId = uploadRes.inspectionId || uploadRes.inspection_id;

      // 2. Trigger asynchronous server AI grading and transition, bypassing mock data
      await startAnalysisFlow(blob, serverInspectionId);
    } catch (err: any) {
      console.warn('Direct backend upload exception, proceeding through resilient inspection flow:', err);
      await startAnalysisFlow(blob);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Primary capture button handler
   */
  const handleCapture = async () => {
    if (isProcessing) return;

    if (isStreaming && videoRef.current) {
      const result = await captureFrame();
      if (result) {
        await uploadAndAnalyze(result.blob, result.dataUrl);
        return;
      }
    }

    if (capturedImage) {
      const blob = capturedImage.startsWith('data:') 
        ? dataURLtoBlob(capturedImage) 
        : await fetch(capturedImage).then((r) => r.blob());
      await uploadAndAnalyze(blob, capturedImage);
      return;
    }

    // If live viewfinder is unavailable, trigger native camera fallback
    nativeCameraInputRef.current?.click();
  };

  /**
   * Native HTML5 Fallback Camera handler (<input type="file" accept="image/*" capture="environment" />)
   */
  const handleNativeCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setCapturedImage(result);
    };
    reader.readAsDataURL(file);

    await uploadAndAnalyze(file);
    e.target.value = '';
  };

  /**
   * Standard Gallery Upload handler (<input type="file" accept="image/*" />)
   */
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setCapturedImage(result);
    };
    reader.readAsDataURL(file);

    await uploadAndAnalyze(file);
    e.target.value = '';
  };

  /**
   * Discards captured image and restarts the live camera viewfinder
   */
  const handleRetake = () => {
    setCapturedImage(null);
    setCameraError(null);
    startCamera();
  };

  const handleRegionChange = (region: GeographicRegion) => {
    setSelectedRegion(region);
  };

  const handleSelectPreset = (preset: SamplePreset) => {
    setActivePreset(preset);
    setActiveDetections(preset.detections);
    setCapturedImage(null);
    if (!isStreaming) {
      startCamera();
    }
  };

  // If in 'analyzing' state, show the required Module 3 Analyzing loading screen
  if (inspectionStep === 'analyzing') {
    const steps = [
      'Detecting individual onions...',
      'Identifying damage and rot...',
      'Estimating Grade A and URS percentages...'
    ];

    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[500px] text-center space-y-6 animate-in fade-in duration-300">
        {/* Orbital AI Scanning Spinner */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping opacity-50" />
          <div className="w-24 h-24 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
          <div className="w-16 h-16 rounded-full border-2 border-teal-400 border-b-transparent animate-spin [animation-duration:1.5s]" />
          <span className="text-3xl absolute animate-pulse">🧅</span>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono uppercase tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>AI Neural Inference Engine</span>
          </div>

          <h3 className="text-base font-extrabold text-white">
            Analyzing Representative Sample
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            {currentBatchId} • {selectedRegion}
          </p>
        </div>

        {/* Step-by-step progressive status list */}
        <div className="w-full max-w-xs space-y-2.5 text-left text-xs bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-xl">
          {steps.map((text, idx) => {
            const isCompleted = analyzingStepIndex > idx;
            const isCurrent = analyzingStepIndex === idx;

            return (
              <div 
                key={idx} 
                className={`flex items-center gap-3 p-2 rounded-xl transition-all duration-300 ${
                  isCurrent 
                    ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold scale-102 shadow-md' 
                    : isCompleted 
                      ? 'text-slate-400 line-through opacity-80' 
                      : 'text-slate-600'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : isCurrent ? (
                  <RefreshCw className="w-4 h-4 text-emerald-400 shrink-0 animate-spin" />
                ) : (
                  <span className="w-4 h-4 rounded-full border border-slate-600 shrink-0 flex items-center justify-center text-[9px] font-mono">
                    {idx + 1}
                  </span>
                )}
                <span className="text-xs">{text}</span>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-slate-500 italic">
          Calibrating bounding boxes against AGMARK standards...
        </p>
      </div>
    );
  }

  // Capture screen
  return (
    <div className="p-4 space-y-4 animate-in fade-in-50 duration-300">
      {/* Session Title & Batch ID */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-emerald-400" />
            Sample Image Capture
          </h2>
          <span className="text-[10.5px] text-slate-400 font-mono">
            Lot ID: <strong className="text-emerald-400">{currentBatchId}</strong>
          </span>
        </div>

        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
          Module 3 Viewport
        </span>
      </div>

      {/* Geographic Selection Dropdown */}
      <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-2">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span>Geographic Source & Variety Profile:</span>
        </label>

        <div className="relative">
          <select
            value={selectedRegion}
            onChange={(e) => handleRegionChange(e.target.value as GeographicRegion)}
            className="w-full bg-slate-800 text-white font-semibold text-xs rounded-xl px-3 py-2.5 border border-slate-700 appearance-none focus:outline-none focus:border-emerald-500 cursor-pointer"
            id="geo-region-selector"
          >
            <option value="Maharashtra">Maharashtra (Nashik, Lasalgaon, Solapur)</option>
            <option value="Madhya Pradesh">Madhya Pradesh (Malwa, Indore, Mandsaur)</option>
            <option value="Karnataka">Karnataka (Hubballi, Dharwad, Kurnool border)</option>
            <option value="Gujarat">Gujarat (Mahuva, Gondal, Bhavnagar)</option>
            <option value="Rajasthan">Rajasthan (Alwar, Kota, Jaipur)</option>
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Variety profiling insight */}
        <div className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-[11px] text-slate-300">
          <div className="flex justify-between font-semibold text-emerald-400 text-[10.5px]">
            <span>Variety: {geographicProfiles[selectedRegion].variety}</span>
            <span>Mandi: {geographicProfiles[selectedRegion].mandi}</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 italic">
            "{geographicProfiles[selectedRegion].desc}"
          </p>
        </div>
      </div>

      {/* Quick Preset Selector Ribbon */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300 flex items-center gap-1 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Select Representative Test Sample:
          </span>
          <span className="text-[10px] text-slate-500">5 APMC Scenarios</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {SAMPLE_PRESETS.map((preset) => {
            const isSelected = activePreset.id === preset.id && !capturedImage;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-900/40'
                    : 'bg-slate-800/90 text-slate-300 hover:text-white border-slate-700/80 hover:bg-slate-800'
                }`}
              >
                <span>🧅</span>
                <span>{preset.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Mobile Camera Viewfinder / Preview / Fallback Container */}
      <div className="space-y-2">
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-700/80 shadow-2xl flex flex-col items-center justify-center group">
          {/* State 1: Captured Image Preview */}
          {capturedImage ? (
            <div className="w-full h-full relative">
              <img 
                src={capturedImage} 
                alt="Captured Onion Sample" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-sm border border-emerald-500/40 text-[9.5px] font-mono font-bold text-emerald-300 flex items-center gap-1.5 shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>HIGH-RES CAPTURE READY</span>
              </div>
              <button
                onClick={handleRetake}
                className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 text-[10px] font-semibold flex items-center gap-1.5 shadow-md transition"
                id="retake-photo-btn"
              >
                <RotateCcw className="w-3 h-3 text-amber-400" />
                <span>Retake</span>
              </button>
            </div>
          ) : cameraError ? (
            /* State 2: Camera Error & Automatic Native Fallback Area */
            <div className="w-full h-full p-4 flex flex-col items-center justify-center text-center bg-slate-900/95 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                {cameraError.type === 'NotAllowedError' ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <CameraOff className="w-6 h-6" />
                )}
              </div>

              <div className="space-y-1 max-w-xs">
                <h4 className="text-xs font-extrabold text-white">
                  {cameraError.type === 'NotAllowedError' && 'Camera Permission Denied'}
                  {cameraError.type === 'NotFoundError' && 'No Camera Hardware Found'}
                  {cameraError.type !== 'NotAllowedError' && cameraError.type !== 'NotFoundError' && 'Live Viewfinder Unavailable'}
                </h4>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  {cameraError.message}
                </p>
              </div>

              {/* Automatic Native Camera Trigger Button */}
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full max-w-xs pt-1">
                <button
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition"
                  id="error-native-camera-btn"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Launch Native Camera App</span>
                </button>

                <button
                  onClick={startCamera}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition"
                  id="error-retry-camera-btn"
                >
                  <RefreshCw className="w-3 h-3 text-sky-400" />
                  <span>Retry Camera</span>
                </button>
              </div>
            </div>
          ) : isLoadingCamera ? (
            /* State 3: Camera Initializing */
            <div className="w-full h-full flex flex-col items-center justify-center relative bg-gradient-to-b from-slate-900 to-slate-950 space-y-3">
              <div className="w-10 h-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              <div className="text-center space-y-0.5">
                <span className="text-xs font-bold text-white block">
                  Initializing Rear Optical Camera...
                </span>
                <span className="text-[10px] text-emerald-400/80 font-mono">
                  facingMode: &#123; exact: "environment" &#125;
                </span>
              </div>
            </div>
          ) : (
            /* State 4: Live Environment Camera Viewfinder */
            <div className="w-full h-full relative bg-black flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                id="camera-video-feed"
              />

              {/* Optical Reticle Frame & AI Brackets Overlay */}
              <div className="absolute inset-4 border border-slate-400/30 rounded-xl pointer-events-none flex items-center justify-center">
                {/* Center Crosshairs */}
                <div className="w-10 h-0.5 bg-emerald-400/50" />
                <div className="h-10 w-0.5 bg-emerald-400/50 absolute" />

                {/* Calibrated Corner Brackets */}
                <span className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                <span className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                <span className="absolute bottom-1 left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                <span className="absolute bottom-1 right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
              </div>

              {/* Top Viewfinder HUD */}
              <div className="absolute top-2 left-2 right-2 flex justify-between items-center pointer-events-none z-10">
                <div className="px-2.5 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-emerald-500/40 text-[9.5px] font-mono font-bold text-emerald-300 flex items-center gap-1.5 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>LIVE REAR CAMERA (ENVIRONMENT)</span>
                </div>
                <div className="px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 text-[9.5px] font-mono text-slate-300">
                  <span>TARGET: 5KG TRAY</span>
                </div>
              </div>

              {/* Bottom Viewfinder HUD */}
              <div className="absolute bottom-2 left-3 right-3 flex justify-between text-[9px] font-mono text-slate-400 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 pointer-events-none z-10">
                <span>1080p FHD • 50mm Lens</span>
                <span>Caliber [20 - 80mm]</span>
                <span className="text-emerald-400 font-bold">READY FOR CAPTURE</span>
              </div>
            </div>
          )}
        </div>

        {/* Fallback Inputs & Hidden Frame Canvas */}
        {/* 1. Native HTML5 Fallback Input: Directly triggers OS camera app in rear mode */}
        <input 
          type="file" 
          ref={nativeCameraInputRef} 
          onChange={handleNativeCameraCapture} 
          accept="image/*" 
          capture="environment" 
          className="hidden" 
          id="native-camera-fallback"
        />

        {/* 2. Secondary Fallback Input: Gallery File Picker */}
        <input 
          type="file" 
          ref={galleryInputRef} 
          onChange={handleGalleryUpload} 
          accept="image/*" 
          className="hidden" 
          id="gallery-file-input"
        />

        {/* Hidden Canvas for High-Resolution Snapshot Extraction */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Action Trigger Buttons */}
      <div className="space-y-2 pt-1">
        {/* Primary Action Button */}
        {capturedImage ? (
          <button
            onClick={handleCapture}
            disabled={isProcessing}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 active:scale-98 transition disabled:opacity-50"
            id="analyze-image-btn"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Uploading & Analyzing...</span>
              </>
            ) : (
              <>
                <Scan className="w-4 h-4" />
                <span>Analyze Sample Image</span>
              </>
            )}
          </button>
        ) : cameraError ? (
          <button
            onClick={() => nativeCameraInputRef.current?.click()}
            disabled={isProcessing}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 active:scale-98 transition disabled:opacity-50"
            id="fallback-native-camera-btn"
          >
            <Camera className="w-4 h-4" />
            <span>Open Device Camera (Native App)</span>
          </button>
        ) : (
          <button
            onClick={handleCapture}
            disabled={isProcessing || isLoadingCamera}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 active:scale-98 transition disabled:opacity-50"
            id="capture-image-btn"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Capturing Frame & Uploading...</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span>{t('captureImage')}</span>
              </>
            )}
          </button>
        )}

        {/* Secondary Action: Standard "Upload from Gallery" Fallback Button */}
        <button
          onClick={() => galleryInputRef.current?.click()}
          disabled={isProcessing}
          className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700/90 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 flex items-center justify-center gap-2 transition disabled:opacity-50"
          id="upload-gallery-btn"
        >
          <Upload className="w-3.5 h-3.5 text-sky-400" />
          <span>{t('uploadImage')}</span>
        </button>
      </div>
    </div>
  );
};
