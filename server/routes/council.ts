import { Router } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";
import { asyncHandler } from "../middleware/errorHandler";
import { requireAdmin } from "../middleware/admin";
import { users, mirrorWallets, mirrorTx } from "@shared/schema";
import { eq } from "drizzle-orm";

export const council = Router();

// Require admin for all council routes
council.use(requireAdmin);

// GET /api/council/metrics
council.get("/metrics", asyncHandler(async (_req, res) => {
  // Execute SQL directly for views (since Drizzle doesn't know about our views)
  const [usersData, secData, analyticsData, spendData] = await Promise.all([
    db.execute(sql`
      select 
        u.id,
        u.email,
        coalesce(u.full_name, split_part(u.email,'@',1)) as name,
        u.empress_role,
        w.balance as coins_balance,
        u.created_at
      from users u
      left join mirror_wallets w on w.user_id = u.id
      order by u.created_at desc 
      limit 200
    `),
    db.execute(sql`
      select
        date_trunc('day', created_at) as day,
        count(*) filter (where (meta->>'status')::text in ('401','403')) as auth_failures,
        count(*) filter (where source = 'rate_limit') as rate_limited,
        count(*) filter (where source = 'health' and message='ping_ok') as health_pings
      from system_logs
      where created_at >= now() - interval '7 days'
      group by day
      order by day
    `),
    db.execute(sql`
      select
        date_trunc('day', created_at) as day,
        count(*) as total_events,
        count(*) filter (where event_type = 'proof_approved') as approvals,
        count(*) filter (where event_type = 'asset_uploaded') as uploads,
        count(*) filter (where event_type = 'mockup_enqueued') as mockups
      from analytics_events
      where created_at >= now() - interval '30 days'
      group by day
      order by day
    `),
    db.execute(sql`
      select
        date_trunc('day', created_at) as day,
        sum(case when delta < 0 then -delta else 0 end) as coins_spent,
        sum(case when delta > 0 then delta else 0 end) as coins_granted
      from mirror_tx
      where created_at >= now() - interval '30 days'
      group by day
      order by day
    `),
  ]);

  // Calculate totals
  const totalCoins = await db.execute(sql`
    select coalesce(sum(balance),0) as total from mirror_wallets
  `);

  const totals = {
    users: (usersData as any).rows?.length ?? 0,
    coins_in_circulation: (totalCoins as any).rows?.[0]?.total ?? 0,
    approvals_30d: (analyticsData as any).rows?.reduce((a:number, r:any) => a + (parseInt(r.approvals) || 0), 0) ?? 0,
    uploads_30d: (analyticsData as any).rows?.reduce((a:number, r:any) => a + (parseInt(r.uploads) || 0), 0) ?? 0,
  };

  res.json({
    totals,
    users: (usersData as any).rows ?? [],
    security: (secData as any).rows ?? [],
    analytics: (analyticsData as any).rows ?? [],
    spend: (spendData as any).rows ?? [],
  });
}));

// POST /api/council/users/:id/role - Update user role
council.post("/users/:id/role", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body as { role: "admin" | "user" };
  
  if (!["admin", "user"].includes(role)) {
    return res.status(400).json({ error: { code: "BAD_ROLE", message: "Invalid role" } });
  }
  
  await db
    .update(users)
    .set({ empressRole: role })
    .where(eq(users.id, id));
    
  res.json({ ok: true });
}));

// POST /api/council/wallets/:id/grant - Grant coins to a user
council.post("/wallets/:id/grant", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body as { amount: number };
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: { code: "INVALID_AMOUNT", message: "Amount must be positive" } });
  }
  
  // Update or create wallet
  await db.execute(sql`
    insert into mirror_wallets (user_id, balance) 
    values (${id}, ${amount})
    on conflict (user_id) 
    do update set 
      balance = mirror_wallets.balance + ${amount}, 
      updated_at = now()
  `);
  
  // Log the transaction
  await db.insert(mirrorTx).values({
    userId: id,
    delta: amount,
    reason: 'admin_grant',
    meta: { grantedBy: req.user?.id }
  });
  
  res.json({ ok: true });
}));

// GET /api/council/kpis - Get UX KPIs
council.get("/kpis", asyncHandler(async (_req, res) => {
  const kpisData = await db.execute(sql`
    with first_value as (
      select owner_id, min(created_at) as first_approval_at
      from analytics_events
      where event_type = 'proof_approved'
      group by owner_id
    ),
    signup as (
      select id as user_id, created_at as signup_at from users
    )
    select
      date_trunc('day', e.created_at) as day,
      avg(extract(epoch from (fv.first_approval_at - s.signup_at))/3600)
        filter (where fv.first_approval_at is not null) as ttfv_hours,
      percentile_cont(0.5) within group (order by (e.meta->>'turnaround_hours')::numeric)
        filter (where e.event_type='proof_approved') as approval_median_hours,
      (count(*) filter (where e.event_type='proof_changes_requested')::numeric) /
      nullif(count(*) filter (where e.event_type in ('proof_approved','proof_changes_requested'))::numeric,0) as rework_rate
    from analytics_events e
    left join first_value fv on fv.owner_id = e.owner_id
    left join signup s on s.user_id = e.owner_id
    where e.created_at >= now() - interval '30 days'
    group by 1
    order by 1
  `);

  res.json({
    kpis: (kpisData as any).rows ?? []
  });
}));

export default council;