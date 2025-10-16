import { Router } from 'express';
import { db } from './db';
import * as schema from '@shared/schema';
import { eq } from 'drizzle-orm';
import { upload } from './uploads';
import { authMiddleware, type AuthRequest } from './auth';

const router = Router();

// Helper to append an asset (url/type/label) into approvals.assetsJson.items[]
async function appendAsset(approvalId: string, asset: { url: string; type: string; label?: string }) {
  const [row] = await db.select().from(schema.approvals).where(eq(schema.approvals.id, approvalId));
  if (!row) throw new Error('Approval not found');

  const current = (row.assetsJson as any) || {};
  const items = current.items || [];
  
  items.push({
    ...asset,
    addedAt: new Date().toISOString(),
  });

  await db.update(schema.approvals)
    .set({ assetsJson: { items } })
    .where(eq(schema.approvals.id, approvalId));

  return { items };
}

// POST /api/approvals/:id/assets - Add an asset by URL (admin)
router.post('/api/approvals/:id/assets', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { url, type = 'reference', label } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Verify ownership
    const [approval] = await db.select().from(schema.approvals).where(eq(schema.approvals.id, id));
    if (!approval || approval.ownerId !== req.user!.id) {
      return res.status(404).json({ error: 'Approval not found' });
    }

    const result = await appendAsset(id, { url, type, label });
    res.json(result);
  } catch (error: any) {
    console.error('Error adding asset:', error);
    res.status(500).json({ error: error.message || 'Failed to add asset' });
  }
});

// POST /api/approvals/:id/upload - Upload file asset (admin)
router.post('/api/approvals/:id/upload', authMiddleware, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { label } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Verify ownership
    const [approval] = await db.select().from(schema.approvals).where(eq(schema.approvals.id, id));
    if (!approval || approval.ownerId !== req.user!.id) {
      return res.status(404).json({ error: 'Approval not found' });
    }

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

    const result = await appendAsset(id, {
      url: fileUrl,
      type: 'upload',
      label: label || req.file.originalname,
    });

    res.json({ url: fileUrl, ...result });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: error.message || 'Failed to upload file' });
  }
});

// POST /api/approvals/:token/upload - Public upload via share token (client)
router.post('/api/approvals/:token/upload', upload.single('file'), async (req, res) => {
  try {
    const { token } = req.params;
    const { label } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Find approval by share token
    const [approval] = await db.select().from(schema.approvals).where(eq(schema.approvals.shareToken, token));
    if (!approval) {
      return res.status(404).json({ error: 'Invalid share link' });
    }

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

    const result = await appendAsset(approval.id, {
      url: fileUrl,
      type: 'client_upload',
      label: label || req.file.originalname,
    });

    res.json({ success: true, url: fileUrl, ...result });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: error.message || 'Failed to upload file' });
  }
});

export default router;
