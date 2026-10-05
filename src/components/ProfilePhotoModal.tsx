import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, Trash2, Check, X, ZoomIn, User } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

interface ProfilePhotoModalProps {
  isOpen: boolean;
  currentPhoto: string;
  playerName: string;
  onSavePhoto: (dataUrl: string, newPlayerName?: string) => void;
  onClose: () => void;
}

export const ProfilePhotoModal: React.FC<ProfilePhotoModalProps> = ({
  isOpen,
  currentPhoto,
  playerName,
  onSavePhoto,
  onClose,
}) => {
  const [rawImage, setRawImage] = useState<string>(currentPhoto);
  const [nameInput, setNameInput] = useState<string>(playerName);
  const [zoom, setZoom] = useState<number>(1);
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const loadedImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setRawImage(currentPhoto);
    setNameInput(playerName);
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
    setCameraError('');
  }, [currentPhoto, playerName, isOpen]);

  useEffect(() => {
    if (!rawImage) {
      loadedImgRef.current = null;
      return;
    }
    const img = new Image();
    img.onload = () => {
      loadedImgRef.current = img;
      renderCropPreview();
    };
    img.src = rawImage;
  }, [rawImage, zoom, offsetX, offsetY]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    soundEngine.playClick();
    setCameraError('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API is not supported in this browser.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 512 }, height: { ideal: 512 } },
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 60);
    } catch {
      setCameraError('Could not access camera. Please select an image from your gallery instead.');
    }
  };

  const captureFromCamera = () => {
    soundEngine.playClick();
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const size = Math.min(video.videoWidth || 400, video.videoHeight || 400);
    canvas.width = 320;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    if (ctx && size > 0) {
      const sx = ((video.videoWidth || 400) - size) / 2;
      const sy = ((video.videoHeight || 400) - size) / 2;
      ctx.drawImage(video, sx, sy, size, size, 0, 0, 320, 320);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      setRawImage(dataUrl);
      setZoom(1);
      setOffsetX(0);
      setOffsetY(0);
    }
    stopCamera();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setRawImage(reader.result);
        setZoom(1);
        setOffsetX(0);
        setOffsetY(0);
      }
    };
    reader.readAsDataURL(file);
  };

  const renderCropPreview = () => {
    const canvas = cropCanvasRef.current;
    const img = loadedImgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const targetSize = 256;
    canvas.width = targetSize;
    canvas.height = targetSize;

    ctx.clearRect(0, 0, targetSize, targetSize);
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, targetSize, targetSize);

    // Preserve aspect ratio (object-cover math, never distorting the face)
    const imgAspect = img.width / img.height;
    let drawWidth = targetSize;
    let drawHeight = targetSize;

    if (imgAspect > 1) {
      drawHeight = targetSize;
      drawWidth = targetSize * imgAspect;
    } else {
      drawWidth = targetSize;
      drawHeight = targetSize / imgAspect;
    }

    drawWidth *= zoom;
    drawHeight *= zoom;

    const dx = (targetSize - drawWidth) / 2 + offsetX;
    const dy = (targetSize - drawHeight) / 2 + offsetY;

    ctx.drawImage(img, dx, dy, drawWidth, drawHeight);
  };

  useEffect(() => {
    renderCropPreview();
  }, [zoom, offsetX, offsetY, rawImage]);

  if (!isOpen) return null;

  const handleConfirmSave = () => {
    soundEngine.playClick();
    stopCamera();
    const trimmedName = nameInput.trim() || 'BABU';
    if (!rawImage) {
      onSavePhoto('', trimmedName);
      onClose();
      return;
    }
    const canvas = cropCanvasRef.current;
    if (canvas && loadedImgRef.current) {
      renderCropPreview();
      const croppedUrl = canvas.toDataURL('image/jpeg', 0.88);
      onSavePhoto(croppedUrl, trimmedName);
    } else {
      onSavePhoto(rawImage, trimmedName);
    }
    onClose();
  };

  const handleRemoveImage = () => {
    soundEngine.playClick();
    setRawImage('');
    loadedImgRef.current = null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <h2 className="font-display text-xl font-bold text-white">Change Profile Photo</h2>
          <button
            onClick={() => {
              soundEngine.playClick();
              stopCamera();
              onClose();
            }}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Player Name Input */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Player Name</label>
            <input
              type="text"
              value={nameInput}
              maxLength={18}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm font-semibold focus:outline-none focus:border-amber-500"
              placeholder="BABU"
            />
          </div>

          {/* Preview / Camera Area */}
          <div className="flex flex-col items-center">
            {cameraActive ? (
              <div className="relative w-44 h-44 rounded-2xl overflow-hidden border-2 border-amber-500 bg-black">
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                <button
                  onClick={captureFromCamera}
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs shadow-lg whitespace-nowrap"
                >
                  Capture Photo
                </button>
              </div>
            ) : rawImage ? (
              <div className="relative w-44 h-44 rounded-2xl overflow-hidden border-2 border-amber-500/80 bg-slate-950 shadow-inner">
                <canvas ref={cropCanvasRef} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-44 h-44 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                <User className="w-12 h-12 text-amber-400 mb-2" />
                <span className="text-xs">Upload your photo for Loading Screen, Profile & Developer Card</span>
              </div>
            )}
          </div>

          {cameraError && (
            <p className="text-xs text-red-400 text-center">{cameraError}</p>
          )}

          {/* Non-distorting Crop & Pan Controls */}
          {rawImage && !cameraActive && (
            <div className="space-y-2.5 bg-slate-950/80 p-3.5 rounded-2xl border border-white/5">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <ZoomIn className="w-3.5 h-3.5 text-amber-400" /> Crop Zoom (No Face Distortion)
                </span>
                <span className="font-mono-num">{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-amber-500"
              />
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Horizontal Pan</span>
                  <input
                    type="range"
                    min="-80"
                    max="80"
                    step="2"
                    value={offsetX}
                    onChange={(e) => setOffsetX(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-500"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Vertical Pan</span>
                  <input
                    type="range"
                    min="-80"
                    max="80"
                    step="2"
                    value={offsetY}
                    onChange={(e) => setOffsetY(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                stopCamera();
                fileInputRef.current?.click();
              }}
              className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <Upload className="w-4 h-4 text-amber-400" />
              Select Gallery
            </button>

            <button
              type="button"
              onClick={cameraActive ? stopCamera : startCamera}
              className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <Camera className="w-4 h-4 text-cyan-400" />
              {cameraActive ? 'Stop Camera' : 'Use Camera'}
            </button>
          </div>

          {rawImage && (
            <button
              type="button"
              onClick={handleRemoveImage}
              className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Remove Current Photo
            </button>
          )}

          <p className="text-[11px] text-slate-400 text-center">
            Stored strictly on your device in local storage. Never uploaded to any external server.
          </p>

          <button
            type="button"
            onClick={handleConfirmSave}
            className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-colors"
          >
            <Check className="w-5 h-5" />
            Save Profile Photo
          </button>
        </div>
      </div>
    </div>
  );
};

interface PlayerAvatarProps {
  photoUrl: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  photoUrl,
  name,
  size = 'md',
  onClick,
}) => {
  const dim =
    size === 'xl'
      ? 'w-24 h-24 text-2xl'
      : size === 'lg'
      ? 'w-16 h-16 text-xl'
      : size === 'sm'
      ? 'w-9 h-9 text-xs'
      : 'w-11 h-11 text-sm';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-2xl overflow-hidden border-2 border-amber-500/80 bg-slate-800 flex items-center justify-center shrink-0 group focus:outline-none ${dim}`}
      title="Change Profile Photo"
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-amber-500/30 via-slate-800 to-red-500/30 flex items-center justify-center font-display font-bold text-amber-300">
          {name.slice(0, 2).toUpperCase()}
        </div>
      )}
    </button>
  );
};
