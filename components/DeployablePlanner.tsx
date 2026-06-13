"use client";

import { useEffect, useMemo, useState } from "react";

type Row = Record<string, any>;
type Day = { date: string; dateKo?: string; createdAt?: string; note?: string; noteUpdatedAt?: string; groups?: Record<string, Row[]> };
type Data = { updatedAt?: string; dataSource?: string; dailyRecords?: Day[] };

const API = "https://city-contacted-cameron-realize.trycloudflare.com";
const ORDER = ["핵심추천", "급등", "단기", "장기", "가격대 후보"];

const money = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? `${Math.round(n).toLocaleString("ko-KR")}원` : "-";
};
const pct = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? `${n > 0 ? "+" : ""}${n.toFixed(2).replace(/\.?0+$/, "")}%` : "0%";
};
const rateClass = (v: any) => Number(v) > 0 ? "bg-emerald-500/18 text-emerald-200" : Number(v) < 0 ? "bg-red-500/18 text-red-200" : "bg-white/10 text-slate-200";
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const shortDate = (s?: string) => (s || "-").replaceAll("-", ".");
const stockUrl = (r: Row) => r.stockUrl || r.url || `https://finance.naver.com/item/main.naver?code=${r.code || ""}`;
const label = (s: string) => s.includes("핵심") ? "핵심추천" : s.includes("급등") ? "급등" : s.includes("단기") ? "단기" : s.includes("장기") ? "장기" : s.includes("가격") ? "가격대 후보" : s;

async function json(url: string, ms = 12000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { cache: "no-store", signal: ctrl.signal });
    const body = await res.text();
    if (!res.ok) throw new Error(`${res.status}`);
    return body ? JSON.parse(body) : {};
  } finally {
    clearTimeout(timer);
  }
}

function groups(day?: Day) {
  return Object.entries(day?.groups || {})
    .map(([k, v]) => [label(k), v || []] as [string, Row[]])
    .sort((a, b) => (ORDER.indexOf(a[0]) < 0 ? 99 : ORDER.indexOf(a[0])) - (ORDER.indexOf(b[0]) < 0 ? 99 : ORDER.indexOf(b[0])));
}

function best(day?: Day) {
  let out = "";
  let top = -999;
  groups(day).forEach(([name, rows]) => {
    const vals = rows.map((r) => Number(r.changePct ?? r.changeRate)).filter(Number.isFinite);
    if (!vals.length) return;
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    if (avg > top) {
      top = avg;
      out = `${name} ${pct(avg)}`;
    }
  });
  return out;
}

export default function DeployablePlanner() {
  const [data, setData] = useState<Data>({});
  const [picked, setPicked] = useState("");
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("일일기록 로딩 중...");
  const [errors, setErrors] = useState<string[]>([]);

  const days = useMemo(() => [...(data.dailyRecords || [])].sort((a, b) => b.date.localeCompare(a.date)), [data]);
  const byDate = useMemo(() => Object.fromEntries(days.map((d) => [d.date, d])), [days]);
  const day = picked ? byDate[picked] : days[0];

  const log = (msg: string) => setErrors((p) => [`${new Date().toLocaleString("ko-KR")} · ${msg}`, ...p].slice(0, 5));

  async function load(silent = false) {
    try {
      if (!silent) setStatus("Cloudflare 원본 확인 중...");
      let next: Data;
      try {
        next = await json(`${API}/api/data?quick=1&ts=${Date.now()}`, 15000);
      } catch (e: any) {
        log(`실시간 연결 실패, Vercel 스냅샷 사용: ${e.message}`);
        next = await json(`/data/app-data.json?ts=${Date.now()}`, 8000);
      }
      setData(next);
      const sorted = [...(next.dailyRecords || [])].sort((a, b) => b.date.localeCompare(a.date));
      setPicked((p) => p || sorted[0]?.date || "");
      setNotes((p) => {
        const copy = { ...p };
        sorted.forEach((d) => { if (copy[d.date] === undefined) copy[d.date] = d.note || ""; });
        return copy;
      });
      setStatus(`일일기록 반영 · ${next.updatedAt || new Date().toLocaleString("ko-KR")}`);
    } catch (e: any) {
      setStatus("일일기록 로딩 실패");
      log(e.message || String(e));
    }
  }

  async function livePrices() {
    const codes = Array.from(new Set(days.flatMap((d) => groups(d).flatMap(([, rows]) => rows.map((r) => r.code).filter(Boolean)))));
    if (!codes.length) return;
    try {
      const live = await json(`${API}/api/live-prices?codes=${encodeURIComponent(codes.join(","))}&ts=${Date.now()}`, 12000);
      const map = Object.fromEntries((live.items || []).map((x: Row) => [x.code, x]));
      setData((prev) => ({
        ...prev,
        dailyRecords: (prev.dailyRecords || []).map((d) => ({
          ...d,
          groups: Object.fromEntries(Object.entries(d.groups || {}).map(([g, rows]) => [g, (rows || []).map((r) => {
            const x = map[r.code];
            if (!x?.currentPrice) return r;
            const base = Number(r.pickPrice || r.basePrice || r.price || 0);
            return { ...r, currentPrice: x.currentPrice, changeRate: x.changeRate ?? r.changeRate, changePct: base ? Number((((x.currentPrice - base) / base) * 100).toFixed(2)) : r.changePct };
          })]))
        }))
      }));
      setStatus(`실시간 주가 반영 · ${live.updatedAt || new Date().toLocaleString("ko-KR")}`);
    } catch (e: any) {
      log(`실시간 주가 실패: ${e.message}`);
    }
  }

  async function saveNote(date: string) {
    try {
      setStatus("메모 저장 중...");
      const res = await fetch(`${API}/api/daily-note`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date, note: notes[date] || "" }) });
      const body = await res.json();
      if (!res.ok || !body.ok) throw new Error(body.error || String(res.status));
      setData((p) => ({ ...p, dailyRecords: (p.dailyRecords || []).map((d) => d.date === date ? { ...d, note: notes[date] || "", noteUpdatedAt: body.updatedAt } : d) }));
      setStatus(`메모 저장 완료 · ${body.updatedAt || ""}`);
    } catch (e: any) {
      setStatus("메모 저장 실패");
      log(e.message || String(e));
    }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const a = setInterval(() => document.visibilityState === "visible" && livePrices(), 15000);
    const b = setInterval(() => document.visibilityState === "visible" && load(true), 180000);
    return () => { clearInterval(a); clearInterval(b); };
  }, [days]);

  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [month]);

  return (
    <main className="min-h-screen bg-bg px-3 py-4 text-ink">
      <div className="mx-auto grid max-w-5xl gap-4">
        <header className="rounded-lg border border-line bg-panel/90 p-4">
          <p className="text-xs font-black text-growth">모바일 전용 요약본</p>
          <h1 className="mt-1 text-2xl font-black">국내주식 일일기록</h1>
          <p className="mt-2 text-sm text-muted">원본 웹페이지의 일일기록만 가져온 화면입니다. 실시간 주가와 메모 저장은 Cloudflare 원본과 연결됩니다.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => load()} className="rounded-lg bg-growth px-3 py-2 text-sm font-black text-black">새로고침</button>
            <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-slate-200">{status}</span>
          </div>
        </header>

        <section className="rounded-lg border border-line bg-panel/90 p-4">
          <div className="flex items-center justify-between">
            <button className="rounded-lg bg-white/10 px-3 py-2 font-black" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>이전</button>
            <b className="text-lg">{month.getFullYear()}년 {month.getMonth() + 1}월</b>
            <button className="rounded-lg bg-white/10 px-3 py-2 font-black" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>다음</button>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-black text-muted">{["일", "월", "화", "수", "목", "금", "토"].map((x) => <div key={x}>{x}</div>)}</div>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {cells.map((d) => {
              const id = iso(d), rec = byDate[id], memo = !!String(rec?.note || "").trim();
              return <button key={id} disabled={!rec} onClick={() => rec && setPicked(id)} className={`relative min-h-16 rounded-lg border p-1 text-left ${rec ? "border-line bg-white/[0.04]" : "border-transparent"} ${picked === id ? "border-growth bg-growth/10" : ""} ${memo ? "border-emerald-400/70" : ""} ${d.getMonth() !== month.getMonth() ? "opacity-30" : ""}`}>
                <span className="text-xs font-black">{d.getDate()}</span>
                {memo ? <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald-400" /> : null}
                {rec ? <span className="mt-2 block truncate text-[10px] font-bold text-growth">{best(rec)}</span> : null}
              </button>;
            })}
          </div>
          <p className="mt-3 text-xs text-muted">초록 점은 메모가 작성된 날만 표시됩니다. 날짜를 누르면 해당일 종목이 펼쳐집니다.</p>
        </section>

        {day ? <section className="rounded-lg border border-line bg-panel/90 p-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div><p className="text-xs font-black text-growth">선택 날짜</p><h2 className="text-2xl font-black">{day.dateKo || shortDate(day.date)}</h2><p className="mt-1 text-xs text-muted">기록가는 전일 정규장 종가 기준, 등락률은 현재가 기준입니다.</p></div>
            <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-muted">{day.createdAt || "기록 시간 확인"}</span>
          </div>
          <div className="mt-4 rounded-lg border border-line bg-white/[0.035] p-3">
            <div className="flex items-center justify-between gap-2"><b className="text-growth">당일 이슈 메모</b><button onClick={() => saveNote(day.date)} className="rounded-lg bg-growth px-3 py-1.5 text-sm font-black text-black">저장</button></div>
            <textarea value={notes[day.date] ?? day.note ?? ""} onChange={(e) => setNotes((p) => ({ ...p, [day.date]: e.target.value }))} className="mt-3 h-28 w-full resize-y rounded-lg border border-line bg-black/20 p-3 text-sm outline-none focus:border-growth" placeholder="오늘 이슈, 뉴스 재료, 수급 변화, 체크할 내용을 적어두세요" />
            <p className="mt-2 text-xs text-muted">{day.noteUpdatedAt ? `마지막 저장 ${day.noteUpdatedAt}` : "저장 전"}</p>
          </div>
          <div className="mt-4 grid gap-3">{groups(day).map(([g, rows]) => {
            const key = `${day.date}-${g}`, isOpen = open[key] ?? true;
            return <div key={key} className="rounded-lg border border-line bg-white/[0.035]">
              <button onClick={() => setOpen((p) => ({ ...p, [key]: !isOpen }))} className="flex w-full items-center justify-between p-3 text-left"><span><b className="text-lg">{g}</b><span className="ml-2 text-xs text-muted">{rows.length}개</span></span><span className="rounded-full bg-white/10 px-2 py-1 text-xs font-black">{isOpen ? "접기" : "펼치기"}</span></button>
              {isOpen ? <div className="grid gap-2 border-t border-line p-3">{rows.map((r, i) => <Stock key={`${r.code}-${i}`} row={r} />)}</div> : null}
            </div>;
          })}</div>
        </section> : <section className="rounded-lg border border-line bg-panel/90 p-4">기록 없음</section>}

        {errors.length ? <details className="rounded-lg border border-line bg-panel/90 p-4 text-xs text-muted"><summary className="cursor-pointer font-black text-growth">연결 상태</summary>{errors.map((e, i) => <p key={i} className="mt-1">{e}</p>)}</details> : null}
      </div>
    </main>
  );
}

function Stock({ row }: { row: Row }) {
  const r = row.changePct ?? row.changeRate;
  return <article className="rounded-lg bg-black/15 p-3">
    <a href={stockUrl(row)} target="_blank" className="block">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><div className="truncate text-lg font-black">{row.name || "종목명 확인"} <span className="text-sm text-muted">{row.code || ""}</span></div><div className="mt-1 truncate text-xs text-muted">{row.sector || row.theme || "섹터 확인"}</div></div>
        <div className="shrink-0 text-right"><div className="font-black">{money(row.currentPrice || row.price || row.pickPrice)}</div><span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-black ${rateClass(r)}`}>{pct(r)}</span></div>
      </div>
    </a>
    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
      <Box title="기록가" value={money(row.pickPrice || row.basePrice || row.price)} />
      <Box title="현재가" value={money(row.currentPrice || row.price)} />
      <Box title="기록대비" value={pct(r)} tone={rateClass(r)} />
    </div>
    {(row.dailyChanges || []).length ? <details className="mt-3 rounded-lg border border-line bg-white/[0.025] p-3"><summary className="cursor-pointer text-sm font-black text-growth">일자별 등락률</summary><div className="mt-3 grid gap-1"><div className="grid grid-cols-[44px_76px_1fr_1fr_1fr] gap-1 text-[11px] font-black text-muted"><span>일차</span><span>일자</span><span className="text-right">전일종가</span><span className="text-right">당일종가</span><span className="text-right">기록대비</span></div>{row.dailyChanges.map((x: Row, i: number) => <div key={`${x.date}-${i}`} className="grid grid-cols-[44px_76px_1fr_1fr_1fr] items-center gap-1 border-t border-white/10 py-1.5 text-xs"><b>{i + 1}일차</b><span className="text-muted">{shortDate(x.date)}</span><b className="text-right">{money(x.prevClose || x.open)}</b><b className="text-right">{money(x.close)}</b><b className={`text-right ${Number(x.changePct) >= 0 ? "text-emerald-200" : "text-red-200"}`}>{pct(x.changePct)}</b></div>)}</div></details> : null}
  </article>;
}

function Box({ title, value, tone = "" }: { title: string; value: string; tone?: string }) {
  return <div className="rounded-lg bg-white/[0.04] p-2"><div className="text-[11px] text-muted">{title}</div><div className={`mt-1 font-black ${tone}`}>{value}</div></div>;
}
