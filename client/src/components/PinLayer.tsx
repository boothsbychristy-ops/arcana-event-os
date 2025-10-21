import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MessageCircle, X, Check, Palette, Type, Image, MoreHorizontal } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Pin {
  id: string;
  x: number;
  y: number;
  zoom?: number;
  message: string;
  author: string;
  reason?: 'logo' | 'color' | 'text' | 'other';
  createdAt: string;
}

interface PinLayerProps {
  proofId: string;
  imageUrl: string;
  readOnly?: boolean;
}

export function PinLayer({ proofId, imageUrl, readOnly = false }: PinLayerProps) {
  const [adding, setAdding] = useState(false);
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [newPin, setNewPin] = useState<{ x: number; y: number } | null>(null);
  const [message, setMessage] = useState("");
  const [reason, setReason] = useState<'logo' | 'color' | 'text' | 'other'>('other');
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch existing pins
  const { data: pins = [] } = useQuery<Pin[]>({
    queryKey: ['/api/proofs', proofId, 'comments'],
    queryFn: async () => {
      const res = await fetch(`/api/proofs/${proofId}/comments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch pins');
      return res.json();
    }
  });

  // Add pin mutation
  const addPinMutation = useMutation({
    mutationFn: async (data: { x: number; y: number; message: string; reason: string }) => {
      return apiRequest(`/api/proofs/${proofId}/comments`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/proofs', proofId, 'comments'] });
      setAdding(false);
      setNewPin(null);
      setMessage("");
      setReason('other');
    }
  });

  const handleImageClick = (e: React.MouseEvent) => {
    if (!adding || readOnly) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    setNewPin({ x, y });
  };

  const handleAddPin = () => {
    if (!newPin || !message.trim()) return;
    
    addPinMutation.mutate({
      x: newPin.x,
      y: newPin.y,
      message,
      reason
    });
  };

  const reasonIcons = {
    logo: <Image className="h-3 w-3" />,
    color: <Palette className="h-3 w-3" />,
    text: <Type className="h-3 w-3" />,
    other: <MoreHorizontal className="h-3 w-3" />
  };

  return (
    <div className="relative">
      {/* Controls */}
      {!readOnly && (
        <div className="flex items-center gap-2 mb-4">
          <Button
            size="sm"
            variant={adding ? "destructive" : "default"}
            onClick={() => {
              setAdding(!adding);
              setNewPin(null);
              setMessage("");
            }}
            data-testid="button-toggle-pin"
            className="gap-2"
          >
            {adding ? (
              <>
                <X className="h-4 w-4" />
                Cancel
              </>
            ) : (
              <>
                <MessageCircle className="h-4 w-4" />
                Add Pin
              </>
            )}
          </Button>
          {adding && (
            <span className="text-sm text-muted-foreground">
              Click on the image to place a pin
            </span>
          )}
        </div>
      )}

      {/* Image with pins */}
      <div 
        ref={containerRef}
        className="relative cursor-crosshair"
        onClick={handleImageClick}
      >
        <img 
          src={imageUrl} 
          alt="Proof"
          className="w-full h-auto rounded-lg"
        />
        
        {/* Existing pins */}
        {pins.map((pin, index) => (
          <button
            key={pin.id}
            className="absolute w-8 h-8 -translate-x-1/2 -translate-y-full flex items-center justify-center"
            style={{ 
              left: `${(parseFloat(pin.x || '0') || 0) * 100}%`, 
              top: `${(parseFloat(pin.y || '0') || 0) * 100}%` 
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPin(selectedPin === pin.id ? null : pin.id);
            }}
            data-testid={`pin-${index + 1}`}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-25" />
              <div className="relative bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg">
                {index + 1}
              </div>
            </div>
          </button>
        ))}
        
        {/* New pin being added */}
        {newPin && (
          <div
            className="absolute w-8 h-8 -translate-x-1/2 -translate-y-full"
            style={{ 
              left: `${newPin.x * 100}%`, 
              top: `${newPin.y * 100}%` 
            }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-green-500 rounded-full animate-ping" />
              <div className="relative bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg">
                +
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pin details popup */}
      {selectedPin && (
        <Card className="mt-4 p-4">
          {pins.filter(p => p.id === selectedPin).map(pin => (
            <div key={pin.id} className="space-y-2">
              <div className="flex items-center gap-2">
                {reasonIcons[pin.reason || 'other']}
                <span className="text-xs text-muted-foreground capitalize">
                  {pin.reason || 'other'} issue
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  by {pin.author}
                </span>
              </div>
              <p className="text-sm">{pin.message}</p>
            </div>
          ))}
        </Card>
      )}

      {/* Add new pin form */}
      {newPin && (
        <Card className="mt-4 p-4 space-y-3">
          <div className="text-sm font-medium">Add Note</div>
          
          <ToggleGroup 
            type="single" 
            value={reason} 
            onValueChange={(v) => v && setReason(v as any)}
            className="grid grid-cols-4 gap-2"
          >
            <ToggleGroupItem value="logo" size="sm" data-testid="reason-logo">
              <Image className="h-3 w-3 mr-1" />
              Logo
            </ToggleGroupItem>
            <ToggleGroupItem value="color" size="sm" data-testid="reason-color">
              <Palette className="h-3 w-3 mr-1" />
              Color
            </ToggleGroupItem>
            <ToggleGroupItem value="text" size="sm" data-testid="reason-text">
              <Type className="h-3 w-3 mr-1" />
              Text
            </ToggleGroupItem>
            <ToggleGroupItem value="other" size="sm" data-testid="reason-other">
              <MoreHorizontal className="h-3 w-3 mr-1" />
              Other
            </ToggleGroupItem>
          </ToggleGroup>
          
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe the issue..."
            className="min-h-[80px] resize-none"
            data-testid="input-pin-message"
          />
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setNewPin(null);
                setMessage("");
                setReason('other');
              }}
              data-testid="button-cancel-pin"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddPin}
              disabled={!message.trim() || addPinMutation.isPending}
              data-testid="button-save-pin"
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              Save Pin
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}