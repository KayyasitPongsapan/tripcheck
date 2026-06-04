import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { fetchAll, addMember, saveAvailability, saveHolidays, saveAbroad } from "./supabaseClient";

// TripCheck — group day-off availability planner (Supabase + Vercel)

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DOW = ["S","M","T","W","T","F","S"];
const PALETTE = ["#c75c38","#2f6b58","#d99a2b","#5b6cb5","#9c4f8a","#3f7d8c","#b5563f","#6d8f3a"];

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Hanken+Grotesk:wght@400;500;600;700&display=swap');`;

const css = `
* { box-sizing: border-box; margin: 0; padding: 0; }
.tc-root {
  --paper:#f7f1e8; --paper-2:#fffdf9; --ink:#2c2622; --ink-soft:#6b6157; --line:#e3d8c8;
  --terra:#c75c38; --terra-deep:#a8472a; --teal:#2f6b58; --teal-soft:#dcebe4;
  --gold:#d99a2b; --gold-soft:#f6e8c8;
  font-family:'Hanken Grotesk',sans-serif; color:var(--ink);
  background: radial-gradient(1200px 600px at 80% -10%,#fbe9d6 0%,transparent 60%),
              radial-gradient(1000px 500px at -10% 110%,#e6efe7 0%,transparent 55%), var(--paper);
  min-height:100vh; width:100%;
}
.tc-wrap { max-width:1100px; margin:0 auto; padding:28px 20px 80px; }
.tc-login { max-width:440px; margin:8vh auto 0; text-align:center; }
.tc-stamp { display:inline-block; border:1.5px dashed var(--terra); color:var(--terra);
  font-size:11px; letter-spacing:2px; text-transform:uppercase; font-weight:700;
  padding:5px 12px; border-radius:6px; transform:rotate(-2deg); margin-bottom:22px; }
.tc-login h1 { font-family:'Fraunces',serif; font-size:46px; line-height:1.02; font-weight:600; letter-spacing:-1px; }
.tc-login p { color:var(--ink-soft); margin:14px 0 28px; font-size:16px; }
.tc-input { width:100%; padding:15px 16px; border:1.5px solid var(--line); border-radius:12px;
  font-size:16px; font-family:inherit; background:var(--paper-2); color:var(--ink); outline:none; }
.tc-input:focus { border-color:var(--terra); box-shadow:0 0 0 4px #c75c3820; }
.tc-btn { background:var(--terra); color:#fff; border:none; border-radius:12px; padding:15px 20px;
  font-size:16px; font-weight:700; font-family:inherit; cursor:pointer; width:100%; margin-top:12px;
  transition:transform .12s ease,background .2s; }
.tc-btn:hover { background:var(--terra-deep); transform:translateY(-1px); }
.tc-btn:disabled { opacity:.45; cursor:default; transform:none; }
.tc-existing { margin-top:26px; }
.tc-existing-label { font-size:12px; text-transform:uppercase; letter-spacing:1.5px; color:var(--ink-soft); margin-bottom:10px; }
.tc-chip { display:inline-block; background:var(--paper-2); border:1.5px solid var(--line);
  padding:8px 14px; border-radius:999px; margin:4px; cursor:pointer; font-weight:600; font-size:14px; transition:all .15s; }
.tc-chip:hover { border-color:var(--terra); color:var(--terra); }
.tc-head { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; margin-bottom:8px; }
.tc-title { font-family:'Fraunces',serif; font-size:34px; font-weight:600; letter-spacing:-.5px; }
.tc-sub { color:var(--ink-soft); font-size:14px; margin-top:2px; }
.tc-who { text-align:right; font-size:13px; color:var(--ink-soft); }
.tc-who b { color:var(--ink); font-weight:700; }
.tc-link { color:var(--terra); cursor:pointer; text-decoration:underline; font-weight:600; }
.tc-share { background:var(--teal); color:#fff; border:none; border-radius:10px; padding:8px 14px;
  font-size:13px; font-weight:700; font-family:inherit; cursor:pointer; margin-top:6px; }
.tc-share:hover { filter:brightness(1.08); }
.tc-yearnav { display:flex; align-items:center; gap:12px; margin-bottom:18px; }
.tc-yearbtn { background:var(--paper-2); border:1.5px solid var(--line); border-radius:10px;
  padding:8px 14px; cursor:pointer; font-family:inherit; font-weight:700; font-size:14px; color:var(--ink); transition:all .15s; }
.tc-yearbtn:hover { border-color:var(--terra); color:var(--terra); }
.tc-yearnum { font-family:'Fraunces',serif; font-size:24px; font-weight:600; min-width:60px; text-align:center; }
.tc-bar { display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-bottom:22px;
  background:var(--paper-2); border:1.5px solid var(--line); border-radius:16px; padding:12px 14px; }
.tc-toggle { display:flex; background:var(--paper); border:1.5px solid var(--line); border-radius:10px; overflow:hidden; }
.tc-toggle button { border:none; background:transparent; padding:9px 14px; font-family:inherit; font-weight:600;
  font-size:13px; cursor:pointer; color:var(--ink-soft); white-space:nowrap; }
.tc-toggle button.on { background:var(--ink); color:var(--paper-2); }
.tc-legend { display:flex; gap:12px; flex-wrap:wrap; margin-left:auto; font-size:12px; color:var(--ink-soft); align-items:center; }
.tc-dot { display:inline-block; width:11px; height:11px; border-radius:3px; margin-right:5px; vertical-align:-1px; }
.tc-members { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:20px; }
.tc-member { display:flex; align-items:center; gap:7px; background:var(--paper-2); border:1.5px solid var(--line);
  border-radius:999px; padding:5px 12px 5px 6px; font-size:13px; font-weight:600; }
.tc-ava { width:24px; height:24px; border-radius:50%; display:grid; place-items:center; color:#fff; font-size:11px; font-weight:700; flex-shrink:0; }
.tc-ava-lg { width:30px; height:30px; font-size:13px; }
.tc-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:18px; }
.tc-month { background:var(--paper-2); border:1.5px solid var(--line); border-radius:16px; padding:14px 14px 16px; }
.tc-mname { font-family:'Fraunces',serif; font-size:17px; font-weight:600; margin-bottom:10px; }
.tc-dow { display:grid; grid-template-columns:repeat(7,1fr); gap:3px; margin-bottom:4px; }
.tc-dow span { text-align:center; font-size:10px; font-weight:700; color:var(--ink-soft); text-transform:uppercase; }
.tc-days { display:grid; grid-template-columns:repeat(7,1fr); gap:3px; }
.tc-day { aspect-ratio:1; border:none; border-radius:8px; background:transparent; font-family:inherit;
  font-size:12.5px; cursor:pointer; color:var(--ink); position:relative; display:grid; place-items:center;
  transition:background .12s,transform .08s; }
.tc-day:hover:not(:disabled) { background:#00000008; }
.tc-day:disabled { cursor:default; }
.tc-day.pad { visibility:hidden; }
.tc-day.weekend { color:var(--terra); }
.tc-day.holiday { background:var(--gold-soft); color:var(--gold); font-weight:700; }
.tc-day.holiday::after { content:''; position:absolute; top:3px; right:3px; width:5px; height:5px; border-radius:50%; background:var(--gold); }
.tc-day.mine { background:var(--teal); color:#fff; font-weight:700; }
.tc-day.abroad { background:#ed7d3a; color:#fff; font-weight:700; }
.tc-day .plane { position:absolute; top:1px; left:3px; font-size:8px; }
.tc-day .cnt { position:absolute; bottom:1px; right:3px; font-size:8px; font-weight:700; opacity:.8; }
.tc-tooltip { position:fixed; background:var(--ink); color:#fff; border-radius:12px; padding:11px 14px;
  font-size:13px; z-index:1000; min-width:160px; max-width:220px; box-shadow:0 8px 24px #00000030; pointer-events:none; }
.tc-tooltip-title { font-size:11px; opacity:.6; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; }
.tc-tooltip-row { display:flex; align-items:center; gap:8px; margin-bottom:5px; }
.tc-tooltip-row:last-child { margin-bottom:0; }
.tc-rec { background:var(--paper-2); border:1.5px solid var(--line); border-radius:18px; padding:22px 22px 24px; }
.tc-rec h2 { font-family:'Fraunces',serif; font-size:24px; font-weight:600; margin-bottom:4px; }
.tc-rec .lead { color:var(--ink-soft); font-size:14px; margin-bottom:20px; }
.tc-reccard { border:1.5px solid var(--line); border-radius:14px; padding:16px; margin-bottom:12px; background:var(--paper); }
.tc-reccard.all-card { border-color:var(--teal); background:var(--teal-soft); }
.tc-reccard .rng { font-family:'Fraunces',serif; font-size:19px; font-weight:600; }
.tc-reccard .meta { font-size:13px; color:var(--ink-soft); margin-top:3px; }
.tc-badge { display:inline-block; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.5px;
  padding:3px 9px; border-radius:999px; margin-bottom:8px; }
.tc-badge.all { background:var(--teal); color:#fff; }
.tc-badge.most { background:var(--gold); color:#fff; }
.tc-avail-rows { margin-top:12px; display:flex; flex-direction:column; gap:6px; }
.tc-avail-row { display:flex; align-items:center; gap:8px; font-size:13px; }
.tc-avail-names { display:flex; flex-wrap:wrap; gap:6px; }
.tc-avail-name { display:flex; align-items:center; gap:5px; background:rgba(255,255,255,.6); border-radius:999px; padding:3px 10px 3px 4px; font-size:12px; font-weight:600; }
.tc-empty { color:var(--ink-soft); font-size:14px; padding:20px 0; text-align:center; font-style:italic; }
.tc-pill { font-size:12px; background:var(--gold-soft); color:var(--gold); border:1px solid #d99a2b40; padding:3px 10px; border-radius:999px; font-weight:700; }
.tc-sheet-wrap { overflow-x:auto; border:1.5px solid var(--line); border-radius:16px; background:var(--paper-2); }
.tc-sheet { border-collapse:collapse; min-width:100%; }
.tc-sheet th, .tc-sheet td { border:1px solid var(--line); white-space:nowrap; }
.tc-sheet-name { position:sticky; left:0; background:var(--paper-2); z-index:10; padding:8px 14px;
  font-weight:700; font-size:13px; min-width:110px; border-right:2px solid var(--line); }
.tc-sheet-mhdr { background:var(--paper); font-family:'Fraunces',serif; font-weight:600; font-size:14px;
  text-align:center; padding:8px 4px; border-bottom:2px solid var(--line); }
.tc-sheet-dhdr { text-align:center; font-size:11px; padding:4px 2px; width:28px; color:var(--ink-soft); font-weight:600; }
.tc-sheet-dhdr.wknd { color:var(--terra); }
.tc-sheet-dhdr.hol { background:var(--gold-soft); color:var(--gold); }
.tc-sheet-cell { text-align:center; width:28px; height:30px; font-size:11px; font-weight:600; }
.tc-sheet-cell.avail { background:#c6e8d6; color:#1a5c3a; }
.tc-sheet-cell.abroad { background:#fbdcc4; color:#a8521b; }
.tc-sheet-cell.popular { background:#fef3c7; color:#92660a; }
.tc-sheet-sumrow td { background:var(--paper); font-weight:700; font-size:11px; text-align:center; border-top:2px solid var(--line); }
.tc-sheet-legend { display:flex; gap:16px; flex-wrap:wrap; font-size:12px; color:var(--ink-soft); padding:14px 16px; border-top:1.5px solid var(--line); align-items:center; }
.tc-note { font-size:12.5px; color:var(--ink-soft); margin-top:24px; line-height:1.5; border-top:1px dashed var(--line); padding-top:14px; }
.tc-toast { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:var(--ink); color:#fff;
  padding:12px 20px; border-radius:12px; font-size:14px; font-weight:600; z-index:2000; box-shadow:0 8px 24px #00000030; }
`;

const pad = n => String(n).padStart(2,"0");
const dateKey = (y,m,d) => `${y}-${pad(m+1)}-${pad(d)}`;
const initials = name => name.trim().split(/\s+/).map(w=>w[0]).join("").slice(0,2).toUpperCase();
const colorFor = (name, members) => PALETTE[members.indexOf(name) % PALETTE.length];

function fmtRange(start, end) {
  const s = new Date(start+"T00:00:00"), e = new Date(end+"T00:00:00");
  const opt = { month:"short", day:"numeric" };
  if (start === end) return s.toLocaleDateString("en-US",{ weekday:"short",...opt });
  return `${s.toLocaleDateString("en-US",opt)} – ${e.toLocaleDateString("en-US",opt)}`;
}
function daysBetween(start, end) { return Math.round((new Date(end) - new Date(start)) / 86400000); }
function addDays(ds, n) {
  const d = new Date(ds+"T00:00:00"); d.setDate(d.getDate()+n);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function getYearData(data, year) { return data.years[year] || { holidays:[], avail:{}, abroad:{} }; }

// ── group id from URL (the shareable deep link) ──────────────
function useGroupId() {
  const [groupId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    let g = params.get("g");
    if (!g) {
      g = Math.random().toString(36).slice(2, 9);
      params.set("g", g);
      window.history.replaceState({}, "", `?${params.toString()}`);
    }
    return g;
  });
  return groupId;
}

function Tooltip({ info, members }) {
  if (!info) return null;
  const { ds, x, y, avail, abroad = [] } = info;
  const date = new Date(ds+"T00:00:00");
  const label = date.toLocaleDateString("en-US",{ weekday:"short", month:"short", day:"numeric" });
  const unavail = members.filter(m => !avail.includes(m));
  const abroadSet = new Set(abroad);
  const rows = avail.length + unavail.length;
  const style = {
    left: Math.min(x+12, window.innerWidth - 240),
    top: y > window.innerHeight/2 ? Math.max(10, y - rows*28 - 90) : y + 12,
  };
  return (
    <div className="tc-tooltip" style={style}>
      <div className="tc-tooltip-title">{label}</div>
      {avail.map(m => (
        <div className="tc-tooltip-row" key={m}>
          <span className="tc-ava" style={{ background:colorFor(m,members), width:20, height:20, fontSize:9 }}>{initials(m)}</span>
          <span>{m}{abroadSet.has(m) ? " ✈️" : ""}</span>
          <span style={{ marginLeft:"auto", color:"#5fe09a" }}>✓</span>
        </div>
      ))}
      {unavail.map(m => (
        <div className="tc-tooltip-row" key={m} style={{ opacity:.55 }}>
          <span className="tc-ava" style={{ background:colorFor(m,members), width:20, height:20, fontSize:9 }}>{initials(m)}</span>
          <span>{m}{abroadSet.has(m) ? " ✈️" : ""}</span>
          <span style={{ marginLeft:"auto" }}>✗</span>
        </div>
      ))}
      <div style={{ fontSize:11, opacity:.6, marginTop:8, borderTop:"1px solid #ffffff25", paddingTop:7 }}>
        {avail.length} of {members.length} available{abroad.length ? ` · ✈️ ${abroad.length} abroad` : ""}
      </div>
    </div>
  );
}

export default function App() {
  const groupId = useGroupId();
  const [loading, setLoading] = useState(true);
  const [data, setData]   = useState({ members:[], years:{} });
  const [me, setMe]       = useState(() => localStorage.getItem("tc-name-"+groupId) || null);
  const [nameInput, setNameInput] = useState("");
  const [year, setYear]   = useState(new Date().getFullYear());
  const [view, setView]   = useState("mine");
  const [mode, setMode]   = useState("off"); // "off" | "abroad" | "holiday"
  const [tooltip, setTooltip] = useState(null);
  const [toast, setToast] = useState(null);
  const savingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (savingRef.current) return;
    const d = await fetchAll(groupId);
    setData(d);
  }, [groupId]);

  // initial load + polling so everyone sees each other's updates
  useEffect(() => {
    (async () => { await refresh(); setLoading(false); })();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    const hide = () => setTooltip(null);
    window.addEventListener("scroll", hide, true);
    return () => window.removeEventListener("scroll", hide, true);
  }, []);

  const yd = useMemo(() => getYearData(data, year), [data, year]);
  const holidaySet = useMemo(() => new Set(yd.holidays), [yd]);
  const mineSet    = useMemo(() => new Set(yd.avail[me] || []), [yd, me]);
  const myAbroadSet = useMemo(() => new Set((yd.abroad && yd.abroad[me]) || []), [yd, me]);

  const countsMap = useMemo(() => {
    const c = {};
    for (const m of data.members) for (const d of (yd.avail[m] || [])) c[d] = (c[d]||0)+1;
    return c;
  }, [data.members, yd]);

  const abroadCountsMap = useMemo(() => {
    const c = {};
    for (const m of data.members) for (const d of ((yd.abroad && yd.abroad[m]) || [])) c[d] = (c[d]||0)+1;
    return c;
  }, [data.members, yd]);

  const availOnDate = useCallback(ds =>
    data.members.filter(m => (yd.avail[m]||[]).includes(ds)), [data.members, yd]);
  const abroadOnDate = useCallback(ds =>
    data.members.filter(m => ((yd.abroad && yd.abroad[m])||[]).includes(ds)), [data.members, yd]);

  const join = async name => {
    const n = name.trim(); if (!n) return;
    savingRef.current = true;
    setMe(n); localStorage.setItem("tc-name-"+groupId, n);
    setData(prev => prev.members.includes(n) ? prev : { ...prev, members:[...prev.members, n] });
    await addMember(groupId, n);
    savingRef.current = false;
    setNameInput("");
    refresh();
  };

  const toggleDay = async ds => {
    savingRef.current = true;
    if (mode === "holiday") {
      const s = new Set(holidaySet); s.has(ds) ? s.delete(ds) : s.add(ds);
      const arr = [...s];
      setData(prev => {
        const next = { ...prev, years:{ ...prev.years } };
        next.years[year] = { ...(next.years[year]||{ holidays:[], avail:{}, abroad:{} }), holidays:arr };
        return next;
      });
      await saveHolidays(groupId, year, arr);
    } else if (mode === "abroad") {
      const s = new Set(myAbroadSet); s.has(ds) ? s.delete(ds) : s.add(ds);
      const arr = [...s];
      setData(prev => {
        const next = { ...prev, years:{ ...prev.years } };
        const ny = { ...(next.years[year]||{ holidays:[], avail:{}, abroad:{} }) };
        ny.abroad = { ...(ny.abroad||{}), [me]:arr };
        next.years[year] = ny;
        return next;
      });
      await saveAbroad(groupId, me, year, arr);
    } else {
      const s = new Set(mineSet); s.has(ds) ? s.delete(ds) : s.add(ds);
      const arr = [...s];
      setData(prev => {
        const next = { ...prev, years:{ ...prev.years } };
        const ny = { ...(next.years[year]||{ holidays:[], avail:{}, abroad:{} }) };
        ny.avail = { ...ny.avail, [me]:arr };
        next.years[year] = ny;
        return next;
      });
      await saveAvailability(groupId, me, year, arr);
    }
    savingRef.current = false;
  };

  const showTooltip = useCallback((e, ds) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ ds, avail:availOnDate(ds), abroad:abroadOnDate(ds), x:rect.left, y:rect.top });
  }, [availOnDate, abroadOnDate]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setToast("Link copied — send it to your friends!");
      setTimeout(() => setToast(null), 2500);
    });
  };

  const recs = useMemo(() => {
    const total = data.members.length; if (total === 0) return { all:[], most:[], total };
    const dates = Object.keys(countsMap).filter(d => d.startsWith(String(year))).sort();
    const groupRuns = filterFn => {
      const picked = dates.filter(filterFn); const runs = [];
      for (const d of picked) {
        const last = runs[runs.length-1];
        if (last && daysBetween(last.end, d) === 1) last.end = d;
        else runs.push({ start:d, end:d });
      }
      return runs.sort((a,b) => daysBetween(a.start,a.end) - daysBetween(b.start,b.end)).reverse();
    };
    const all = groupRuns(d => countsMap[d] === total);
    const maxBelow = Math.max(0, ...dates.filter(d => countsMap[d] < total).map(d => countsMap[d]));
    const most = maxBelow > total/2 ? groupRuns(d => countsMap[d] === maxBelow).map(r => ({ ...r, count:maxBelow })) : [];
    return { all, most, total };
  }, [countsMap, data.members, year]);

  const rangeAvail = useCallback((start, end) => {
    const days = []; let cur = start, guard = 0;
    while (cur <= end && guard++ < 400) { days.push(cur); cur = addDays(cur,1); }
    return {
      avail:   data.members.filter(m => days.every(d => (yd.avail[m]||[]).includes(d))),
      unavail: data.members.filter(m => !days.every(d => (yd.avail[m]||[]).includes(d))),
      abroad:  data.members.filter(m => days.some(d => ((yd.abroad && yd.abroad[m])||[]).includes(d))),
    };
  }, [data.members, yd]);

  const sheetMonths = useMemo(() => MONTHS.map((mn, mi) => {
    const dim = new Date(year, mi+1, 0).getDate(); const days = [];
    for (let d=1; d<=dim; d++) {
      const ds = dateKey(year,mi,d); const dow = new Date(year,mi,d).getDay();
      days.push({ d, ds, weekend: dow===0||dow===6, hol: holidaySet.has(ds) });
    }
    return { short:MONTHS_SHORT[mi], days };
  }), [year, holidaySet]);

  if (loading) return <div className="tc-root"><style>{FONTS}{css}</style><div className="tc-wrap" style={{ paddingTop:80, textAlign:"center", color:"var(--ink-soft)" }}>Loading…</div></div>;

  if (!me) return (
    <div className="tc-root">
      <style>{FONTS}{css}</style>
      <div className="tc-wrap"><div className="tc-login">
        <span className="tc-stamp">✦ Group Trip Planner</span>
        <h1>Let's find a day<br/>we're <em>all</em> free.</h1>
        <p>Enter your name to mark the days you're off in {year}. Everyone with this link shares one calendar.</p>
        <input className="tc-input" placeholder="Your name…" value={nameInput}
          onChange={e => setNameInput(e.target.value)} onKeyDown={e => e.key==="Enter" && join(nameInput)} />
        <button className="tc-btn" disabled={!nameInput.trim()} onClick={() => join(nameInput)}>Join the trip →</button>
        {data.members.length > 0 && (
          <div className="tc-existing">
            <div className="tc-existing-label">Or continue as someone already here</div>
            {data.members.map(m => <span key={m} className="tc-chip" onClick={() => { setMe(m); localStorage.setItem("tc-name-"+groupId, m); }}>{m}</span>)}
          </div>
        )}
      </div></div>
    </div>
  );

  return (
    <div className="tc-root" onClick={e => { if (!e.target.closest(".tc-day")) setTooltip(null); }}>
      <style>{FONTS}{css}</style>
      <Tooltip info={tooltip} members={data.members} />
      {toast && <div className="tc-toast">{toast}</div>}

      <div className="tc-wrap">
        <div className="tc-head">
          <div>
            <div className="tc-title">TripCheck</div>
            <div className="tc-sub">Group availability planner</div>
            <button className="tc-share" onClick={copyLink}>🔗 Copy invite link</button>
          </div>
          <div className="tc-who">
            You are <b>{me}</b><br/>
            <span className="tc-link" onClick={() => { localStorage.removeItem("tc-name-"+groupId); setMe(null); }}>switch person ↺</span>
          </div>
        </div>

        <div className="tc-members">
          {data.members.map(m => (
            <span key={m} className="tc-member">
              <span className="tc-ava" style={{ background:colorFor(m,data.members) }}>{initials(m)}</span>
              {m}{m===me?" (you)":""}
            </span>
          ))}
        </div>

        <div className="tc-yearnav">
          <button className="tc-yearbtn" onClick={() => setYear(y => y-1)}>← {year-1}</button>
          <span className="tc-yearnum">{year}</span>
          <button className="tc-yearbtn" onClick={() => setYear(y => y+1)}>{year+1} →</button>
        </div>

        <div className="tc-bar">
          <div className="tc-toggle">
            <button className={view==="mine"?"on":""} onClick={() => setView("mine")}>My days off</button>
            <button className={view==="group"?"on":""} onClick={() => setView("group")}>Heatmap</button>
            <button className={view==="sheet"?"on":""} onClick={() => setView("sheet")}>Spreadsheet</button>
            <button className={view==="recs"?"on":""} onClick={() => setView("recs")}>Recommendations</button>
          </div>
          {view==="mine" && (
            <div className="tc-toggle" style={{ marginLeft:4 }}>
              <button className={mode==="off"?"on":""} onClick={() => setMode("off")}>Tap = my day off</button>
              <button className={mode==="abroad"?"on":""} onClick={() => setMode("abroad")}>Tap = abroad ✈️</button>
              <button className={mode==="holiday"?"on":""} onClick={() => setMode("holiday")}>Tap = set holiday</button>
            </div>
          )}
          {view==="mine" && <div className="tc-legend">
            <span><span className="tc-dot" style={{ background:"var(--teal)" }} />available</span>
            <span><span className="tc-dot" style={{ background:"#ed7d3a" }} />✈️ abroad</span>
            <span><span className="tc-dot" style={{ background:"var(--gold)" }} />holiday</span>
            <span><span className="tc-dot" style={{ background:"var(--terra)", opacity:.5 }} />weekend</span>
          </div>}
          {view==="group" && <div className="tc-legend">
            <span style={{ display:"flex", alignItems:"center", gap:4 }}>
              <span style={{ display:"inline-block", width:40, height:11, borderRadius:3, background:"linear-gradient(to right,rgba(47,107,88,.2),rgba(47,107,88,.85))", marginRight:4 }} />few → all free
            </span>
            <span style={{ fontStyle:"italic", fontSize:11 }}>tap a date to see who's free</span>
          </div>}
        </div>

        {view==="mine" && (
          <div className="tc-grid">
            {MONTHS.map((mn, m) => {
              const first = new Date(year,m,1).getDay(); const dim = new Date(year,m+1,0).getDate(); const cells = [];
              for (let i=0;i<first;i++) cells.push(<button key={"p"+i} className="tc-day pad" disabled />);
              for (let d=1;d<=dim;d++) {
                const ds = dateKey(year,m,d); const dow = new Date(year,m,d).getDay();
                let cls = "tc-day"; if (dow===0||dow===6) cls += " weekend";
                if (holidaySet.has(ds)) cls += " holiday";
                if (mineSet.has(ds)) cls += " mine";
                if (myAbroadSet.has(ds)) cls += " abroad";
                cells.push(<button key={ds} className={cls} onClick={() => toggleDay(ds)}>{myAbroadSet.has(ds) && <span className="plane">✈️</span>}{d}</button>);
              }
              return <div className="tc-month" key={mn}>
                <div className="tc-mname">{mn}</div>
                <div className="tc-dow">{DOW.map((x,i) => <span key={i}>{x}</span>)}</div>
                <div className="tc-days">{cells}</div>
              </div>;
            })}
          </div>
        )}

        {view==="group" && (
          <div className="tc-grid">
            {MONTHS.map((mn, m) => {
              const first = new Date(year,m,1).getDay(); const dim = new Date(year,m+1,0).getDate(); const cells = [];
              for (let i=0;i<first;i++) cells.push(<button key={"p"+i} className="tc-day pad" disabled />);
              for (let d=1;d<=dim;d++) {
                const ds = dateKey(year,m,d); const dow = new Date(year,m,d).getDay();
                const cnt = countsMap[ds]||0; const abr = abroadCountsMap[ds]||0;
                const hasInfo = cnt>0 || abr>0;
                let cls = "tc-day"; if (dow===0||dow===6) cls += " weekend";
                let style = {};
                if (cnt>0 && data.members.length) { const r = cnt/data.members.length;
                  style = { background:`rgba(47,107,88,${0.15+0.7*r})`, color:r>0.5?"#fff":"var(--ink)", fontWeight:700 }; }
                if (holidaySet.has(ds)) style = { ...style, outline:"2px solid var(--gold)", outlineOffset:"-2px" };
                cells.push(
                  <button key={ds} className={cls} style={style}
                    onMouseEnter={e => hasInfo && showTooltip(e,ds)} onMouseLeave={() => setTooltip(null)}
                    onClick={e => { hasInfo ? (tooltip?.ds===ds ? setTooltip(null) : showTooltip(e,ds)) : setTooltip(null); }}>
                    {abr>0 && <span className="plane">✈️</span>}
                    {d}{cnt>0 && <span className="cnt">{cnt}</span>}
                  </button>
                );
              }
              return <div className="tc-month" key={mn}>
                <div className="tc-mname">{mn}</div>
                <div className="tc-dow">{DOW.map((x,i) => <span key={i}>{x}</span>)}</div>
                <div className="tc-days">{cells}</div>
              </div>;
            })}
          </div>
        )}

        {view==="sheet" && (<>
          <div className="tc-sheet-wrap">
            <table className="tc-sheet">
              <thead>
                <tr>
                  <th className="tc-sheet-name" rowSpan={2} style={{ verticalAlign:"bottom", paddingBottom:8 }}>Member</th>
                  {sheetMonths.map(({ short, days }) => <th key={short} className="tc-sheet-mhdr" colSpan={days.length}>{short}</th>)}
                </tr>
                <tr>
                  {sheetMonths.map(({ days }) => days.map(({ d, ds, weekend, hol }) =>
                    <th key={ds} className={`tc-sheet-dhdr${weekend?" wknd":""}${hol?" hol":""}`}>{d}</th>))}
                </tr>
              </thead>
              <tbody>
                {data.members.map(mbr => (
                  <tr key={mbr}>
                    <td className="tc-sheet-name">
                      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                        <span className="tc-ava" style={{ background:colorFor(mbr,data.members) }}>{initials(mbr)}</span>{mbr}
                      </div>
                    </td>
                    {sheetMonths.map(({ days }) => days.map(({ ds }) => {
                      const isAvail = (yd.avail[mbr]||[]).includes(ds);
                      const isAbroad = ((yd.abroad && yd.abroad[mbr])||[]).includes(ds);
                      const cnt = countsMap[ds]||0; const total = data.members.length;
                      const popular = !isAvail && !isAbroad && cnt>0 && cnt>total/2;
                      let cls = "tc-sheet-cell";
                      if (isAbroad) cls += " abroad";
                      else if (isAvail) cls += " avail";
                      else if (popular) cls += " popular";
                      return <td key={ds} className={cls}>{isAbroad?"✈️":isAvail?"✓":popular?"~":""}</td>;
                    }))}
                  </tr>
                ))}
                <tr className="tc-sheet-sumrow">
                  <td className="tc-sheet-name" style={{ fontFamily:"'Fraunces',serif" }}>Free count</td>
                  {sheetMonths.map(({ days }) => days.map(({ ds }) => {
                    const cnt = countsMap[ds]||0; const total = data.members.length;
                    const bg = cnt===total&&total>0 ? "#c6e8d6" : cnt>total/2 ? "#fef3c7" : "transparent";
                    return <td key={ds} style={{ background:bg, color:"var(--ink-soft)" }}>{cnt||""}</td>;
                  }))}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="tc-sheet-legend">
            <b style={{ color:"var(--ink)", marginRight:4 }}>Legend:</b>
            <span><span className="tc-dot" style={{ background:"#c6e8d6", border:"1px solid #3d8f5f" }} />✓ Member is available</span>
            <span><span className="tc-dot" style={{ background:"#fbdcc4", border:"1px solid #ed7d3a" }} />✈️ Abroad</span>
            <span><span className="tc-dot" style={{ background:"#fef3c7", border:"1px solid #d99a2b" }} />~ Popular day — more than half the group is free, but not this member</span>
            <span><span className="tc-dot" style={{ background:"var(--line)" }} />Not available / not marked</span>
            <span style={{ marginLeft:"auto", fontStyle:"italic", fontSize:11 }}>Bottom row = total free per day</span>
          </div>
        </>)}

        {view==="recs" && (
          <div className="tc-rec">
            <h2>When should you go?</h2>
            <div className="lead">{year} · Based on {recs.total} {recs.total===1?"person":"people"}. Longer stretches ranked first.</div>
            {recs.all.length===0 && recs.most.length===0 && (
              <div className="tc-empty">No overlapping days off yet — mark some days and they'll appear here.</div>
            )}
            {recs.all.length > 0 && (<>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:17, margin:"0 0 10px" }}>🌟 Everyone is free</div>
              {recs.all.slice(0,5).map((r,i) => {
                const ra = rangeAvail(r.start, r.end);
                return (<div className="tc-reccard all-card" key={"a"+i}>
                  <span className="tc-badge all">✓ All {recs.total} free</span>
                  <div className="rng">{fmtRange(r.start, r.end)}</div>
                  <div className="meta">{daysBetween(r.start,r.end)+1} day{daysBetween(r.start,r.end)>0?"s":""}</div>
                  <div className="tc-avail-rows"><div className="tc-avail-row">
                    <span style={{ fontSize:13, color:"var(--teal)", fontWeight:700, minWidth:80 }}>✓ Available</span>
                    <div className="tc-avail-names">{ra.avail.map(m => (
                      <span key={m} className="tc-avail-name">
                        <span className="tc-ava tc-ava-lg" style={{ background:colorFor(m,data.members) }}>{initials(m)}</span>{m}
                      </span>))}</div>
                  </div>
                  {ra.abroad.length > 0 && (
                    <div className="tc-avail-row">
                      <span style={{ fontSize:13, color:"#c2641f", fontWeight:700, minWidth:80 }}>✈️ Abroad</span>
                      <div className="tc-avail-names">{ra.abroad.map(m => (
                        <span key={m} className="tc-avail-name">
                          <span className="tc-ava tc-ava-lg" style={{ background:colorFor(m,data.members) }}>{initials(m)}</span>{m}
                        </span>))}</div>
                    </div>
                  )}
                  </div>
                </div>);
              })}
            </>)}
            {recs.most.length > 0 && (<>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:17, margin:"20px 0 10px" }}>If not everyone can make it…</div>
              {recs.most.slice(0,5).map((r,i) => {
                const ra = rangeAvail(r.start, r.end);
                return (<div className="tc-reccard" key={"m"+i}>
                  <span className="tc-badge most">{r.count} of {recs.total} free</span>
                  <div className="rng">{fmtRange(r.start, r.end)}</div>
                  <div className="meta">{daysBetween(r.start,r.end)+1} day{daysBetween(r.start,r.end)>0?"s":""}</div>
                  <div className="tc-avail-rows">
                    <div className="tc-avail-row">
                      <span style={{ fontSize:13, color:"var(--teal)", fontWeight:700, minWidth:80 }}>✓ Available</span>
                      <div className="tc-avail-names">{ra.avail.map(m => (
                        <span key={m} className="tc-avail-name">
                          <span className="tc-ava tc-ava-lg" style={{ background:colorFor(m,data.members) }}>{initials(m)}</span>{m}
                        </span>))}</div>
                    </div>
                    {ra.unavail.length > 0 && (
                      <div className="tc-avail-row">
                        <span style={{ fontSize:13, color:"var(--terra)", fontWeight:700, minWidth:80 }}>✗ Can't make it</span>
                        <div className="tc-avail-names">{ra.unavail.map(m => (
                          <span key={m} className="tc-avail-name" style={{ opacity:.65 }}>
                            <span className="tc-ava tc-ava-lg" style={{ background:colorFor(m,data.members) }}>{initials(m)}</span>{m}
                          </span>))}</div>
                      </div>
                    )}
                    {ra.abroad.length > 0 && (
                      <div className="tc-avail-row">
                        <span style={{ fontSize:13, color:"#c2641f", fontWeight:700, minWidth:80 }}>✈️ Abroad</span>
                        <div className="tc-avail-names">{ra.abroad.map(m => (
                          <span key={m} className="tc-avail-name">
                            <span className="tc-ava tc-ava-lg" style={{ background:colorFor(m,data.members) }}>{initials(m)}</span>{m}
                          </span>))}</div>
                      </div>
                    )}
                  </div>
                </div>);
              })}
            </>)}
          </div>
        )}

        <div className="tc-note">
          <b>Share this trip:</b> tap "Copy invite link" and send it to your friends. Anyone who opens the link types their name once, then marks their own days off. Holidays (gold dot) are set via the toggle under "My days off." Everyone's changes sync automatically every few seconds.
        </div>
      </div>
    </div>
  );
}
