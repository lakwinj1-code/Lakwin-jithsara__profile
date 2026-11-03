import React, { useEffect, useRef, useState } from 'react';
import { Check, Move, RotateCcw, X, ZoomIn } from 'lucide-react';

interface SquarePhotoCropModalProps {
  open: boolean;
  file: File | null;
  saving?: boolean;
  onCancel: () => void;
  onConfirm: (croppedSquareDataUrl: string) => void;
}

const PREVIEW_SIZE = 288;
const OUTPUT_SIZE = 800;

export const SquarePhotoCropModal: React.FC<SquarePhotoCropModalProps> = ({
  open,
  file,
  saving = false,
  onCancel,
  onConfirm,
}) => {
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [imgSrc, setImgSrc] = useState<string>('');
  const [zoom, setZoom] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dragStartRef = useRef<{ x: number; y: number; ox: number; oy: number }>({
    x: 0,
    y: 0,
    ox: 0,
    oy: 0,
  });

  useEffect(() => {
    if (!open || !file) {
      setImgElement(null);
      setImgSrc('');
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setError(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setImgSrc(objectUrl);

    const img = new Image();
    img.onload = () => {
      setImgElement(img);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setError(null);
    };
    img.onerror = () => {
      setError('Selected file could not be loaded as an image.');
    };
    img.src = objectUrl;

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [open, file]);

  if (!open || !file) return null;

  // Compute base cover dimensions so at zoom = 1 the image covers the 1:1 square
  const naturalW = imgElement?.naturalWidth || 1;
  const naturalH = imgElement?.naturalHeight || 1;
  const baseScale = Math.max(PREVIEW_SIZE / naturalW, PREVIEW_SIZE / naturalH);
  const renderedW = naturalW * baseScale * zoom;
  const renderedH = naturalH * baseScale * zoom;

  const clampOffset = (nx: number, ny: number, w = renderedW, h = renderedH) => {
    const maxOffsetX = Math.max(0, (w - PREVIEW_SIZE) / 2);
    const maxOffsetY = Math.max(0, (h - PREVIEW_SIZE) / 2);
    return {
      x: Math.max(-maxOffsetX, Math.min(maxOffsetX, nx)),
      y: Math.max(-maxOffsetY, Math.min(maxOffsetY, ny)),
    };
  };

  const handleZoomChange = (nextZoom: number) => {
    const nextW = naturalW * baseScale * nextZoom;
    const nextH = naturalH * baseScale * nextZoom;
    setZoom(nextZoom);
    setOffset((prev) => clampOffset(prev.x, prev.y, nextW, nextH));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      ox: offset.x,
      oy: offset.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setOffset(clampOffset(dragStartRef.current.ox + dx, dragStartRef.current.oy + dy));
  };

  const handlePointerUp = () => {
    setDragging(false);
  };

  const handleExportSquare = () => {
    if (!imgElement) return;
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setError('Canvas export is unavailable in this browser.');
      return;
    }

    const ratio = OUTPUT_SIZE / PREVIEW_SIZE;
    const drawW = renderedW * ratio;
    const drawH = renderedH * ratio;
    const drawX = (OUTPUT_SIZE - drawW) / 2 + offset.x * ratio;
    const drawY = (OUTPUT_SIZE - drawH) / 2 + offset.y * ratio;

    ctx.fillStyle = '#09090B';
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    ctx.drawImage(imgElement, drawX, drawY, drawW, drawH);

    let dataUrl = canvas.toDataURL('image/jpeg', 0.84);
    if (dataUrl.length > 600000) {
      dataUrl = canvas.toDataURL('image/jpeg', 0.68);
    }
    if (dataUrl.length > 680000) {
      setError('Image is still too large after compression. Please try another photo.');
      return;
    }
    onConfirm(dataUrl);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Adjust 1:1 Square Cover Photo"
      className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md bg-zinc-900 border border-white/12 rounded-3xl p-6 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight text-white">
              Fit Your 1:1 Cover Photo
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Drag and zoom to match the exact square cover-art frame
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel photo crop"
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Exact 1:1 Square Viewport */}
        <div className="mt-5 flex flex-col items-center">
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
            className="relative rounded-2xl overflow-hidden bg-zinc-950 border border-white/15 cursor-grab active:cursor-grabbing touch-none select-none"
          >
            {imgSrc && imgElement && (
              <img
                src={imgSrc}
                alt="Crop preview"
                draggable={false}
                style={{
                  width: `${renderedW}px`,
                  height: `${renderedH}px`,
                  left: `${(PREVIEW_SIZE - renderedW) / 2 + offset.x}px`,
                  top: `${(PREVIEW_SIZE - renderedH) / 2 + offset.y}px`,
                }}
                className="absolute max-w-none pointer-events-none"
              />
            )}

            {/* Subtle 3x3 framing grid lines */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
              <div className="border-r border-b border-white/15" />
              <div className="border-r border-b border-white/15" />
              <div className="border-b border-white/15" />
              <div className="border-r border-b border-white/15" />
              <div className="border-r border-b border-white/15" />
              <div className="border-b border-white/15" />
              <div className="border-r border-white/15" />
              <div className="border-r border-white/15" />
              <div />
            </div>

            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md bg-black/65 text-[11px] text-zinc-200 flex items-center gap-1.5 pointer-events-none whitespace-nowrap">
              <Move className="w-3 h-3" />
              <span>Drag to position</span>
            </div>
          </div>

          {/* Zoom Slider */}
          <div className="mt-4 w-full max-w-[288px] flex items-center gap-3">
            <ZoomIn className="w-4 h-4 text-zinc-400 shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.02}
              value={zoom}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              aria-label="Zoom photo"
              className="flex-1 accent-blue-500 cursor-pointer"
            />
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setOffset({ x: 0, y: 0 });
              }}
              title="Reset position"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-xs text-red-400 text-center">{error}</p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2.5 min-h-[44px] text-xs font-semibold text-zinc-300 bg-white/8 rounded-xl hover:bg-white/12 transition-colors cursor-pointer whitespace-nowrap"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExportSquare}
            disabled={!imgElement || saving}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] text-xs font-semibold text-zinc-950 bg-white rounded-xl hover:bg-zinc-200 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Check className="w-4 h-4 shrink-0" />
            <span>{saving ? 'Saving...' : 'Save Square Photo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
