import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { GitCompare, ChevronLeft, ChevronRight } from "lucide-react";

interface CompareProps {
  currentImage: string;
  previousImage: string;
  currentVersion?: number;
  previousVersion?: number;
}

export function Compare({ currentImage, previousImage, currentVersion = 2, previousVersion = 1 }: CompareProps) {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newPosition = (x / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, newPosition)));
  };
  
  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const newPosition = (x / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, newPosition)));
  };
  
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', () => setIsDragging(false));
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', () => setIsDragging(false));
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', () => setIsDragging(false));
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', () => setIsDragging(false));
      };
    }
  }, [isDragging]);
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitCompare className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">Compare Versions</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">v{previousVersion}</span>
          <Slider
            value={[position]}
            onValueChange={([val]) => setPosition(val)}
            min={0}
            max={100}
            step={1}
            className="w-32"
            data-testid="slider-compare"
          />
          <span className="font-medium">v{currentVersion}</span>
        </div>
      </div>
      
      {/* Compare View */}
      <div 
        ref={containerRef}
        className="relative overflow-hidden rounded-lg select-none"
        style={{ cursor: isDragging ? 'ew-resize' : 'col-resize' }}
      >
        {/* Previous version (left) */}
        <div className="relative w-full h-full">
          <img 
            src={previousImage} 
            alt={`Version ${previousVersion}`}
            className="w-full h-auto"
            draggable={false}
          />
          <div className="absolute top-4 left-4 bg-background/80 backdrop-blur px-2 py-1 rounded text-xs font-medium">
            v{previousVersion}
          </div>
        </div>
        
        {/* Current version (right) */}
        <div 
          className="absolute top-0 left-0 w-full h-full overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <img 
            src={currentImage} 
            alt={`Version ${currentVersion}`}
            className="w-full h-auto"
            draggable={false}
          />
          <div className="absolute top-4 right-4 bg-background/80 backdrop-blur px-2 py-1 rounded text-xs font-medium">
            v{currentVersion}
          </div>
        </div>
        
        {/* Divider */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-primary cursor-col-resize"
          style={{ left: `${position}%` }}
          onMouseDown={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
        >
          {/* Handle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
            <div className="flex gap-0.5">
              <ChevronLeft className="h-3 w-3 text-primary-foreground" />
              <ChevronRight className="h-3 w-3 text-primary-foreground" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPosition(0)}
          data-testid="button-show-previous"
        >
          Show v{previousVersion}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPosition(50)}
          data-testid="button-show-split"
        >
          50/50
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPosition(100)}
          data-testid="button-show-current"
        >
          Show v{currentVersion}
        </Button>
      </div>
    </div>
  );
}