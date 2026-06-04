import { createClient } from "@supabase/supabase-js";

// These values come from your Vercel Environment Variables
// (or a local .env file when developing on your own computer).
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url, anonKey);

// ── Read everything for one group, shaped like the app expects ──
export async function fetchAll(groupId) {
  const [members, avail, hols] = await Promise.all([
    supabase.from("members").select("name").eq("group_id", groupId),
    supabase.from("availability").select("name,year,dates").eq("group_id", groupId),
    supabase.from("holidays").select("year,dates").eq("group_id", groupId),
  ]);

  const data = { members: [], years: {} };
  data.members = (members.data || []).map((r) => r.name);

  for (const row of avail.data || []) {
    if (!data.years[row.year]) data.years[row.year] = { holidays: [], avail: {} };
    data.years[row.year].avail[row.name] = row.dates || [];
  }
  for (const row of hols.data || []) {
    if (!data.years[row.year]) data.years[row.year] = { holidays: [], avail: {} };
    data.years[row.year].holidays = row.dates || [];
  }
  return data;
}

export async function addMember(groupId, name) {
  await supabase.from("members").upsert({ group_id: groupId, name });
}

export async function saveAvailability(groupId, name, year, dates) {
  await supabase.from("availability").upsert({
    group_id: groupId, name, year, dates, updated_at: new Date().toISOString(),
  });
}

export async function saveHolidays(groupId, year, dates) {
  await supabase.from("holidays").upsert({
    group_id: groupId, year, dates, updated_at: new Date().toISOString(),
  });
}
