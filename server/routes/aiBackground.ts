import { Router } from 'express';
import { authMiddleware, type AuthRequest } from '../auth';

const router = Router();

router.post('/api/ai/background', authMiddleware, async (req: AuthRequest, res) => {
  const { prompt } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'missing prompt' });
  }

  try {
    const leonardoApiKey = process.env.LEONARDO_API_KEY;

    if (!leonardoApiKey) {
      // Return a mock URL for development/testing
      const mockUrl = `https://images.unsplash.com/photo-1519167758481-83f29da8c4c0?w=1200&h=800&fit=crop&q=80`;
      return res.json({ 
        url: mockUrl,
        note: 'Using mock image. Add LEONARDO_API_KEY to environment for AI generation.' 
      });
    }

    // Leonardo API integration
    const enhancedPrompt = `${prompt}, ultra high resolution, realistic photographic backdrop, soft lighting, no text`;
    
    const response = await fetch('https://api.leonardo.ai/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${leonardoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        modelId: 'flux.1.1-pro',
        width: 1024,
        height: 768,
        num_images: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`Leonardo API error: ${response.statusText}`);
    }

    const data = await response.json();
    const generatedUrl = data.generations?.[0]?.url || data.url;

    if (!generatedUrl) {
      throw new Error('No image URL returned from Leonardo API');
    }

    res.json({ url: generatedUrl });
  } catch (error: any) {
    console.error('AI Background generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate background',
      message: error.message 
    });
  }
});

export default router;
