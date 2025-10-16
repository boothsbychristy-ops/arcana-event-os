import { db } from '../db';
import { approvals } from '@shared/schema';
import { designAgent } from '../agents/design';
import { eq } from 'drizzle-orm';

export async function onApprovalFeedback(ownerId: string, approvalId: string) {
  const [row] = await db
    .select()
    .from(approvals)
    .where(eq(approvals.id, approvalId));
  
  if (!row) return;

  // Create a theme hint from the approval title and description
  const themeHint = `${row.title} ${row.description || ''}`.trim();

  // Trigger the design agent to regenerate the overlay
  await designAgent({
    ownerId,
    approvalId,
    prompt: themeHint,
  });
}
