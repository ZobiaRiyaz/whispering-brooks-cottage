import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin access required");
}

// ---------- INQUIRIES ----------
export const listInquiries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const updateInquirySchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "contacted", "confirmed", "declined"]).optional(),
  admin_notes: z.string().max(2000).nullable().optional(),
});

export const updateInquiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateInquirySchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const patch: { status?: "new" | "contacted" | "confirmed" | "declined"; admin_notes?: string | null } = {};
    if (data.status !== undefined) patch.status = data.status;
    if (data.admin_notes !== undefined) patch.admin_notes = data.admin_notes;
    const { data: updated, error } = await context.supabase
      .from("inquiries")
      .update(patch)
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Sync the hold for this inquiry based on its status:
    // - declined: release the hold so dates open again.
    // - confirmed: relabel the hold as confirmed.
    // - new/contacted: keep the hold as-is (auto-created on insert).
    if (updated) {
      if (data.status === "declined") {
        await context.supabase.from("blocked_dates").delete().eq("inquiry_id", data.id);
      } else if (data.status === "confirmed") {
        await context.supabase
          .from("blocked_dates")
          .update({
            start_date: updated.check_in,
            end_date: updated.check_out,
            reason: `Confirmed: ${updated.name}`,
          })
          .eq("inquiry_id", data.id);
      }
    }
    return updated;
  });

export const deleteInquiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("inquiries").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- BLOCKED DATES ----------
export const listBlockedDates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("blocked_dates")
      .select("*")
      .order("start_date", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const addBlockSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().max(200).optional(),
});

export const addBlockedDate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => addBlockSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: created, error } = await context.supabase
      .from("blocked_dates")
      .insert({
        start_date: data.start_date,
        end_date: data.end_date,
        reason: data.reason ?? "Blocked",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return created;
  });

export const removeBlockedDate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("blocked_dates").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- CONTENT ----------
const contentSchema = z.object({
  hero_headline: z.string().min(1).max(200),
  hero_subtitle: z.string().min(1).max(500),
  description: z.string().min(1).max(2000),
  amenities: z.array(z.string().min(1).max(100)).max(20),
  contact_email: z.string().email().max(255),
});

export const updateContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => contentSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: updated, error } = await context.supabase
      .from("cottage_content")
      .update(data)
      .eq("id", 1)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return updated;
  });

// ---------- STATS ----------
export const getStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const today = new Date().toISOString().slice(0, 10);
    const [allInquiries, newInquiries, upcoming] = await Promise.all([
      context.supabase.from("inquiries").select("id", { count: "exact", head: true }),
      context.supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
      context.supabase
        .from("inquiries")
        .select("id", { count: "exact", head: true })
        .eq("status", "confirmed")
        .gte("check_in", today),
    ]);
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    const { data: blocks } = await context.supabase
      .from("blocked_dates")
      .select("start_date,end_date")
      .lte("start_date", monthEnd.toISOString().slice(0, 10))
      .gte("end_date", monthStart.toISOString().slice(0, 10));

    const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
    const blockedSet = new Set<string>();
    for (const b of blocks ?? []) {
      const s = new Date(b.start_date);
      const e = new Date(b.end_date);
      for (let d = new Date(s); d < e; d.setDate(d.getDate() + 1)) {
        if (d >= monthStart && d < monthEnd) blockedSet.add(d.toISOString().slice(0, 10));
      }
    }
    return {
      total: allInquiries.count ?? 0,
      newCount: newInquiries.count ?? 0,
      upcoming: upcoming.count ?? 0,
      occupancyPct: Math.round((blockedSet.size / daysInMonth) * 100),
      monthLabel: monthStart.toLocaleString("en", { month: "long", year: "numeric" }),
    };
  });
