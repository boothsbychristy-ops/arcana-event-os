import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function BackgroundPicker({ onSelect }: { onSelect: (url: string) => void }) {
  const [aiPrompt, setPrompt] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function generate() {
    if (!aiPrompt.trim()) {
      toast({
        title: 'Missing Prompt',
        description: 'Please describe the background you want to generate.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ai/background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate background');
      }

      const data = await response.json();
      setPreview(data.url);
      toast({
        title: 'Background Generated!',
        description: 'Your AI background is ready. Click "Use This" to apply it.',
      });
    } catch (error: any) {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Could not generate background. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function handleUseThis() {
    if (preview) {
      onSelect(preview);
      toast({
        title: 'Background Selected',
        description: 'Background has been added to your approval.',
      });
    }
  }

  return (
    <div className="rounded-lg border border-border p-6 bg-card">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">AI Background Generator</h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Describe your background (e.g., sunset ballroom with rose gold tones)"
            value={aiPrompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && generate()}
            disabled={loading}
            data-testid="input-ai-prompt"
          />
          <Button
            onClick={generate}
            disabled={loading || !aiPrompt.trim()}
            data-testid="button-generate-background"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate'
            )}
          </Button>
        </div>

        {preview && (
          <div className="space-y-3">
            <div className="rounded-lg overflow-hidden border border-border">
              <img
                src={preview}
                alt="AI Generated Background"
                className="w-full h-64 object-cover"
                data-testid="img-ai-preview"
              />
            </div>
            <Button
              onClick={handleUseThis}
              className="w-full"
              variant="default"
              data-testid="button-use-background"
            >
              Use This Background
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
