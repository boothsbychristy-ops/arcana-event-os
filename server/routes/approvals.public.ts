import { Router } from "express";
import { db } from "../db";
import { approvals } from "@shared/schema";
import { eq } from "drizzle-orm";
import { Errors } from "../errors";
import { asyncHandler } from "../middleware/errorHandler";
import crypto from "crypto";

export const approvalsPublicRouter = Router();

// Get approval by public share token
approvalsPublicRouter.get("/:token", asyncHandler(async (req, res) => {
  const token = req.params.token;
  
  if (!token || token.length < 10) {
    throw Errors.BAD_REQUEST("Invalid token format");
  }
  
  const rows = await db
    .select()
    .from(approvals)
    .where(eq(approvals.shareToken, token))
    .limit(1);
    
  const approval = rows[0];
  
  if (!approval) {
    throw Errors.NOT_FOUND("Invalid or expired approval link");
  }
  
  // Check if link has expired
  if (approval.shareExpiresAt && new Date() > approval.shareExpiresAt) {
    res.status(410).json({ 
      error: "LINK_EXPIRED",
      message: "This approval link has expired. Please contact the sender for a new link."
    });
    return;
  }
  
  // Update view count and last viewed
  await db.update(approvals)
    .set({ 
      viewsCount: (approval.viewsCount || 0) + 1,
      lastViewedAt: new Date()
    })
    .where(eq(approvals.id, approval.id));
  
  // Return public-safe fields only
  res.json({
    id: approval.id,
    title: approval.title,
    description: approval.description,
    status: approval.status,
    draftUrl: approval.draftUrl,
    assetsJson: approval.assetsJson,
    createdAt: approval.createdAt,
    viewsCount: (approval.viewsCount || 0) + 1,
    // Don't expose: ownerId, feedbackNotes (internal), approvedAt
  });
}));

// Update approval status (public users can approve or request changes)
approvalsPublicRouter.post("/:token/status", asyncHandler(async (req, res) => {
  const token = req.params.token;
  const { status, feedback } = req.body as { status?: string; feedback?: string };
  
  // Validate input
  if (!status || !["approved", "feedback"].includes(status)) {
    throw Errors.BAD_REQUEST("Invalid status. Must be 'approved' or 'feedback'");
  }
  
  // Find the approval
  const rows = await db
    .select()
    .from(approvals)
    .where(eq(approvals.shareToken, token))
    .limit(1);
    
  if (!rows[0]) {
    throw Errors.NOT_FOUND("Invalid or expired approval link");
  }
  
  const updateData: any = { status };
  
  // Add timestamp for approval
  if (status === "approved") {
    updateData.approvedAt = new Date();
  }
  
  // Add feedback notes if provided
  if (feedback && status === "feedback") {
    updateData.feedbackNotes = feedback;
  }
  
  // Update the approval
  await db
    .update(approvals)
    .set(updateData)
    .where(eq(approvals.shareToken, token));
    
  res.json({ 
    ok: true, 
    message: status === "approved" 
      ? "Thank you! Your approval has been recorded." 
      : "Thank you! Your feedback has been recorded."
  });
}));

// Public file upload for approval (if they need to attach feedback assets)
approvalsPublicRouter.post("/:token/upload", asyncHandler(async (req, res) => {
  const token = req.params.token;
  
  // Verify the approval exists
  const rows = await db
    .select()
    .from(approvals)
    .where(eq(approvals.shareToken, token))
    .limit(1);
    
  if (!rows[0]) {
    throw Errors.NOT_FOUND("Invalid or expired approval link");
  }
  
  // This would integrate with your existing upload logic
  // For now, return a placeholder
  res.json({ 
    ok: true,
    message: "Upload endpoint ready for integration with multer"
  });
}))