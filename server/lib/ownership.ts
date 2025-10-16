import { and, eq } from "drizzle-orm";
import { db } from "../db";
import * as schema from "@shared/schema";

export async function getOwnedClient(id: string, ownerId: string) {
  const [row] = await db.select().from(schema.clients)
    .where(and(eq(schema.clients.id, id), eq(schema.clients.ownerId, ownerId)));
  return row ?? null;
}

export async function getOwnedProposal(id: string, ownerId: string) {
  const [row] = await db.select().from(schema.proposals)
    .where(and(eq(schema.proposals.id, id), eq(schema.proposals.ownerId, ownerId)));
  return row ?? null;
}

export async function getOwnedBooking(id: string, ownerId: string) {
  const [row] = await db.select().from(schema.bookings)
    .where(and(eq(schema.bookings.id, id), eq(schema.bookings.ownerId, ownerId)));
  return row ?? null;
}

export async function getOwnedInvoice(id: string, ownerId: string) {
  const [row] = await db.select().from(schema.invoices)
    .where(and(eq(schema.invoices.id, id), eq(schema.invoices.ownerId, ownerId)));
  return row ?? null;
}

export async function getOwnedPayment(id: string, ownerId: string) {
  const [row] = await db.select().from(schema.payments)
    .where(and(eq(schema.payments.id, id), eq(schema.payments.ownerId, ownerId)));
  return row ?? null;
}

export async function getOwnedStaff(id: string, ownerId: string) {
  const [row] = await db.select().from(schema.staff)
    .where(and(eq(schema.staff.id, id), eq(schema.staff.ownerId, ownerId)));
  return row ?? null;
}

export async function getOwnedBoard(id: string, ownerId: string) {
  const [row] = await db.select().from(schema.boards)
    .where(and(eq(schema.boards.id, id), eq(schema.boards.ownerId, ownerId)));
  return row ?? null;
}

export async function getOwnedTask(id: string, ownerId: string) {
  const [row] = await db
    .select()
    .from(schema.tasks)
    .innerJoin(schema.boards, eq(schema.tasks.boardId, schema.boards.id))
    .where(and(eq(schema.tasks.id, id), eq(schema.boards.ownerId, ownerId)));
  return row?.tasks ?? null;
}

export async function getOwnedDeliverable(id: string, ownerId: string) {
  const [row] = await db
    .select()
    .from(schema.deliverables)
    .innerJoin(schema.bookings, eq(schema.deliverables.bookingId, schema.bookings.id))
    .where(and(eq(schema.deliverables.id, id), eq(schema.bookings.ownerId, ownerId)));
  return row?.deliverables ?? null;
}

export async function getOwnedLead(id: string, ownerId: string) {
  const [row] = await db.select().from(schema.leads)
    .where(and(eq(schema.leads.id, id), eq(schema.leads.ownerId, ownerId)));
  return row ?? null;
}

export async function getOwnedBookingStaff(id: string, ownerId: string) {
  const [row] = await db.select().from(schema.bookingStaff)
    .where(and(eq(schema.bookingStaff.id, id), eq(schema.bookingStaff.ownerId, ownerId)));
  return row ?? null;
}

export async function getOwnedAutomation(id: string, ownerId: string) {
  const [row] = await db.select().from(schema.automations)
    .where(and(eq(schema.automations.id, id), eq(schema.automations.ownerId, ownerId)));
  return row ?? null;
}

export async function getOwnedMessage(id: string, ownerId: string) {
  const [row] = await db
    .select()
    .from(schema.messages)
    .innerJoin(schema.bookings, eq(schema.messages.bookingId, schema.bookings.id))
    .where(and(eq(schema.messages.id, id), eq(schema.bookings.ownerId, ownerId)));
  return row?.messages ?? null;
}
