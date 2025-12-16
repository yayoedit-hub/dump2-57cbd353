import { useState, useRef, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, Move } from "lucide-react";

interface AvatarCropperProps {
  imageFile: File;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
  open: boolean;
}

const AVATAR_SIZE = 400;

export function AvatarCropper({ imageFile, onCropComplete, onCancel, open }: AvatarCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [minScale, setMinScale] = useState(1);

  // Load image
  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setImageSrc(src);
      
      const img = new Image();
      img.onload = () => {
        setImageEl(img);
        
        // Calculate minimum scale to cover the crop area (square)
        const scaleX = AVATAR_SIZE / img.width;
        const scaleY = AVATAR_SIZE / img.height;
        const newMinScale = Math.max(scaleX, scaleY);
        
        setMinScale(newMinScale);
        setScale(newMinScale);
        setPosition({
          x: (AVATAR_SIZE - img.width * newMinScale) / 2,
          y: (AVATAR_SIZE - img.height * newMinScale) / 2,
        });
      };
      img.src = src;
    };
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  // Draw preview
  useEffect(() => {
    if (!canvasRef.current || !imageEl) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = AVATAR_SIZE;
    canvas.height = AVATAR_SIZE;

    // Clear
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw image
    ctx.drawImage(
      imageEl,
      position.x,
      position.y,
      imageEl.width * scale,
      imageEl.height * scale
    );

    // Draw circular overlay mask (show what will be cropped)
    ctx.save();
    ctx.globalCompositeOperation = "destination-in";
    ctx.beginPath();
    ctx.arc(AVATAR_SIZE / 2, AVATAR_SIZE / 2, AVATAR_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }, [imageEl, scale, position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !imageEl) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    const scaledWidth = imageEl.width * scale;
    const scaledHeight = imageEl.height * scale;
    
    const maxX = 0;
    const minX = AVATAR_SIZE - scaledWidth;
    const maxY = 0;
    const minY = AVATAR_SIZE - scaledHeight;

    setPosition({
      x: Math.min(maxX, Math.max(minX, newX)),
      y: Math.min(maxY, Math.max(minY, newY)),
    });
  }, [isDragging, dragStart, scale, imageEl]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !imageEl) return;
    
    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;

    const scaledWidth = imageEl.width * scale;
    const scaledHeight = imageEl.height * scale;
    
    const maxX = 0;
    const minX = AVATAR_SIZE - scaledWidth;
    const maxY = 0;
    const minY = AVATAR_SIZE - scaledHeight;

    setPosition({
      x: Math.min(maxX, Math.max(minX, newX)),
      y: Math.min(maxY, Math.max(minY, newY)),
    });
  }, [isDragging, dragStart, scale, imageEl]);

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleScaleChange = (value: number[]) => {
    if (!imageEl) return;
    
    const newScale = value[0];
    const scaledWidth = imageEl.width * newScale;
    const scaledHeight = imageEl.height * newScale;
    
    const maxX = 0;
    const minX = AVATAR_SIZE - scaledWidth;
    const maxY = 0;
    const minY = AVATAR_SIZE - scaledHeight;

    setScale(newScale);
    setPosition(prev => ({
      x: Math.min(maxX, Math.max(minX, prev.x)),
      y: Math.min(maxY, Math.max(minY, prev.y)),
    }));
  };

  const handleCrop = () => {
    if (!imageEl) return;

    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = AVATAR_SIZE;
    outputCanvas.height = AVATAR_SIZE;
    const ctx = outputCanvas.getContext("2d");
    
    if (!ctx) return;

    // Draw the image
    ctx.drawImage(
      imageEl,
      position.x,
      position.y,
      imageEl.width * scale,
      imageEl.height * scale
    );

    // Apply circular mask
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = AVATAR_SIZE;
    tempCanvas.height = AVATAR_SIZE;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    tempCtx.beginPath();
    tempCtx.arc(AVATAR_SIZE / 2, AVATAR_SIZE / 2, AVATAR_SIZE / 2, 0, Math.PI * 2);
    tempCtx.closePath();
    tempCtx.clip();
    tempCtx.drawImage(outputCanvas, 0, 0);

    tempCanvas.toBlob(
      (blob) => {
        if (blob) {
          onCropComplete(blob);
        }
      },
      "image/png",
      1.0
    );
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crop Profile Photo</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Drag to position your photo. It will be cropped to a circle.
          </p>
          
          {/* Preview canvas with circular mask visualization */}
          <div className="relative flex justify-center">
            <div 
              className="relative overflow-hidden rounded-full cursor-move border-2 border-border"
              style={{ width: 256, height: 256 }}
            >
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ width: 256, height: 256 }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              />
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/80 rounded-md px-2 py-1 text-xs flex items-center gap-1">
              <Move className="h-3 w-3" />
              Drag to position
            </div>
          </div>

          {/* Zoom control */}
          <div className="flex items-center gap-4">
            <ZoomOut className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[scale]}
              onValueChange={handleScaleChange}
              min={minScale}
              max={minScale * 3}
              step={0.01}
              className="flex-1"
            />
            <ZoomIn className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleCrop} className="w-full sm:w-auto">
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}