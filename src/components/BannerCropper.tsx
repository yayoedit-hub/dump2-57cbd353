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

interface BannerCropperProps {
  imageFile: File;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
  open: boolean;
}

const BANNER_WIDTH = 1200;
const BANNER_HEIGHT = 300;
const ASPECT_RATIO = BANNER_WIDTH / BANNER_HEIGHT; // 4:1

export function BannerCropper({ imageFile, onCropComplete, onCancel, open }: BannerCropperProps) {
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
        
        // Calculate minimum scale to cover the crop area
        const scaleX = BANNER_WIDTH / img.width;
        const scaleY = BANNER_HEIGHT / img.height;
        const newMinScale = Math.max(scaleX, scaleY);
        
        setMinScale(newMinScale);
        setScale(newMinScale);
        setPosition({
          x: (BANNER_WIDTH - img.width * newMinScale) / 2,
          y: (BANNER_HEIGHT - img.height * newMinScale) / 2,
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

    // Set canvas size to match display
    canvas.width = BANNER_WIDTH;
    canvas.height = BANNER_HEIGHT;

    // Clear and draw
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.drawImage(
      imageEl,
      position.x,
      position.y,
      imageEl.width * scale,
      imageEl.height * scale
    );
  }, [imageEl, scale, position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !imageEl) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Calculate bounds
    const scaledWidth = imageEl.width * scale;
    const scaledHeight = imageEl.height * scale;
    
    const maxX = 0;
    const minX = BANNER_WIDTH - scaledWidth;
    const maxY = 0;
    const minY = BANNER_HEIGHT - scaledHeight;

    setPosition({
      x: Math.min(maxX, Math.max(minX, newX)),
      y: Math.min(maxY, Math.max(minY, newY)),
    });
  }, [isDragging, dragStart, scale, imageEl]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleScaleChange = (value: number[]) => {
    if (!imageEl) return;
    
    const newScale = value[0];
    
    // Adjust position to keep image centered when scaling
    const scaledWidth = imageEl.width * newScale;
    const scaledHeight = imageEl.height * newScale;
    
    const maxX = 0;
    const minX = BANNER_WIDTH - scaledWidth;
    const maxY = 0;
    const minY = BANNER_HEIGHT - scaledHeight;

    setScale(newScale);
    setPosition(prev => ({
      x: Math.min(maxX, Math.max(minX, prev.x)),
      y: Math.min(maxY, Math.max(minY, prev.y)),
    }));
  };

  const handleCrop = () => {
    if (!imageEl) return;

    // Create output canvas at full resolution
    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = BANNER_WIDTH;
    outputCanvas.height = BANNER_HEIGHT;
    const ctx = outputCanvas.getContext("2d");
    
    if (!ctx) return;

    ctx.drawImage(
      imageEl,
      position.x,
      position.y,
      imageEl.width * scale,
      imageEl.height * scale
    );

    outputCanvas.toBlob(
      (blob) => {
        if (blob) {
          onCropComplete(blob);
        }
      },
      "image/jpeg",
      0.9
    );
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Crop Banner Image</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Drag to position your image. The banner will be cropped to 1200×300 pixels.
          </p>
          
          {/* Preview canvas */}
          <div 
            className="relative overflow-hidden rounded-lg border border-border bg-secondary cursor-move"
            style={{ aspectRatio: `${ASPECT_RATIO}` }}
          >
            <canvas
              ref={canvasRef}
              className="w-full h-full"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
            <div className="absolute top-2 right-2 bg-background/80 rounded-md px-2 py-1 text-xs flex items-center gap-1">
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

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleCrop}>
            Apply Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
