import { Router } from "express";
import { db } from "../db";
import { proofComments, proofs } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../auth";
import { asyncHandler } from "../middleware/errorHandler";
import { validate, PinSchema } from "../middleware/validate";

export const proofsRouter = Router();

// POST /api/proofs/:id/comments - Add a pin comment
proofsRouter.post("/:id/comments", 
  authMiddleware, 
  validate(PinSchema),
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const data = req.body; // Already validated by middleware
  
  // Check if proof exists
  const proof = await db.select().from(proofs).where(eq(proofs.id, id)).limit(1);
  if (!proof.length) {
    return res.status(404).json({ error: "Proof not found" });
  }
  
  // Add comment with pin data
  const [comment] = await db.insert(proofComments).values({
    proofId: id,
    author: req.user?.fullName || "User",
    message: data.message,
    x: data.x?.toString(),
    y: data.y?.toString(),
    zoom: data.zoom?.toString(),
    reason: data.reason
  }).returning();
  
  res.json(comment);
}));

// GET /api/proofs/:id/comments - Get all comments for a proof
proofsRouter.get("/:id/comments", authMiddleware, asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  
  const comments = await db
    .select()
    .from(proofComments)
    .where(eq(proofComments.proofId, id))
    .orderBy(proofComments.createdAt);
    
  res.json(comments);
}));

// POST /api/proofs/:id/fork - Create a new version of a proof
proofsRouter.post("/:id/fork", authMiddleware, asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  
  // Get the original proof
  const [original] = await db.select().from(proofs).where(eq(proofs.id, id)).limit(1);
  if (!original) {
    return res.status(404).json({ error: "Proof not found" });
  }
  
  // Create new version
  const newVersion = (original.version || 1) + 1;
  const [newProof] = await db.insert(proofs).values({
    ...original,
    id: undefined, // Let DB generate new ID
    token: undefined, // Let DB generate new token
    version: newVersion,
    prevProofId: id,
    createdAt: new Date(),
    updatedAt: new Date()
  }).returning();
  
  res.json(newProof);
}));

// GET /api/proofs/:id - Get proof with version history
proofsRouter.get("/:id", authMiddleware, asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  
  const [proof] = await db.select().from(proofs).where(eq(proofs.id, id)).limit(1);
  if (!proof) {
    return res.status(404).json({ error: "Proof not found" });
  }
  
  // Get previous version if exists
  let previousProof = null;
  if (proof.prevProofId) {
    [previousProof] = await db.select().from(proofs)
      .where(eq(proofs.id, proof.prevProofId))
      .limit(1);
  }
  
  // Get comments
  const comments = await db
    .select()
    .from(proofComments)
    .where(eq(proofComments.proofId, id))
    .orderBy(proofComments.createdAt);
  
  res.json({
    ...proof,
    previousProof,
    comments
  });
}));

export default proofsRouter;