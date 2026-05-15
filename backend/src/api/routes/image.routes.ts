import { Router } from 'express';

const router = Router();

router.get('/architectural', async (req, res) => {
  const imageUrl = req.query.url as string;

  if (!imageUrl) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  console.log('[ARCH PROXY FETCH]', imageUrl);

  try {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log('[ARCH PROXY SUCCESS]', imageUrl);
    res.send(buffer);
  } catch (error: any) {
    console.error('[ARCH PROXY FAIL]', error.message);
    res.status(500).json({ error: 'Failed to proxy image' });
  }
});

export default router;
