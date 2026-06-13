"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

type Row = Record<string, any>;
type Data = {
  dataSource?: string;
  updatedAt?: string;
  economics?: Row;
  overseas?: Row;
  issues?: Record<string, Row[]>;
  futureThemes?: Record<string, Row[]>;
  commonNews?: Record<string, Row>;
  core?: Row[];
  surge?: Row[];
  short?: Row[];
  long?: Row[];
  pricePicks?: { low?: Row[]; high?: Row[] };
  allNames?: Record<string, Row[]>;
  dailyRecords?: Row[];
};

const tabs = ["경제지표", "해외시장 흐름", "미래테마", "이슈흐름", "핵심", "급등", "단기", "장기", "가격대 후보", "추천 종목 요약", "일일기록"];
const stockTabs: Record<string, keyof Data> = { 핵심: "core", 급등: "surge", 단기: "short", 장기: "long" };

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-line bg-panel/90 p-4 shadow-xl shadow-black/10 ${className}`}>{children}</section>;
}
function Badge({ children, color = "bg-white/10 text-slate-200" }: { children: ReactNode; color?: string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${color}`}>{children}</span>;
}
function nf(v: any) { const n = Number(v); return Number.isFinite(n) && n !== 0 ? n.toLocaleString("ko-KR") : "-"; }
function pct(v: any) { const n = Number(v); return Number.isFinite(n) ? `${n >= 0 ? "+" : ""}${n.toFixed(2).replace(/\.?0+$/, "")}%` : ""; }
function tone(v: any) { const n = Number(v); return n > 0 ? "text-emerald-200" : n < 0 ? "text-red-200" : "text-slate-300"; }
function stockUrl(r: Row) { return r.stockUrl || r.url || `https://finance.naver.com/item/main.naver?code=${r.code || ""}`; }
function textOf(v: any) { return Array.isArray(v) ? v.join(" · ") : (v || "-"); }

function StockCard({ row }: { row: Row }) {
  const rate = row.changeRate ?? row.changePct ?? row.surge?.changeRate;
  const info = row.companyInfo || {};
  const f = row.fundamentals || {};
  return <article className="rounded-lg border border-line bg-white/[0.04] p-3">
    <a href={stockUrl(row)} target="_blank" className="block">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Badge color="bg-sky-400/15 text-sky-100">{row.actionLabel || row.decision || "관찰"}</Badge>
          <div className="mt-2 truncate text-lg font-black text-ink">{row.name || "종목명 확인"}</div>
          <div className="mt-1 text-xs text-muted">{row.code || "-"} · {row.sector || "섹터 확인"}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-2xl font-black text-growth">{row.total ?? row.score ?? "-"}</div>
          <div className="mt-1 text-sm font-black">{nf(row.currentPrice || row.price || row.pickPrice)}원</div>
          {pct(rate) ? <div className={`text-xs font-black ${tone(rate)}`}>{pct(rate)}</div> : null}
        </div>
      </div>
    </a>
    <details className="mt-3 rounded-lg border border-line bg-black/10 p-3">
      <summary className="cursor-pointer text-sm font-black text-growth">종목정보 보기</summary>
      <div className="mt-3 grid gap-2 text-sm">
        <Info label="한 줄 요약" value={info.summary || row.stockInfo || `${row.sector || "해당 업종"} 관련 회사입니다.`} />
        <Info label="핵심 사업" value={info.coreBusiness || row.material || row.sector || "-"} />
        <Info label="투자 포인트" value={info.investorPoint || row.briefing || "수급, 재료, 실적 연결 여부를 확인합니다."} />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {[["PER", f.per], ["PBR", f.pbr], ["ROE", f.roe], ["매출", f.revenue], ["영업률", f.operatingMargin]].map(([k, v]) => <div key={String(k)} className="rounded-lg bg-white/[0.04] p-2"><div className="text-[11px] text-muted">{k}</div><b>{v || "-"}</b></div>)}
        </div>
      </div>
    </details>
  </article>;
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return <div className="rounded-lg bg-white/[0.04] p-3"><div className="text-xs text-muted">{label}</div><div className="mt-1 font-bold leading-relaxed text-ink">{value || "-"}</div></div>;
}

function Economics({ data }: { data?: Row }) {
  const insight = data?.insight || {};
  const indices = insight.indexCards || data?.indices || [];
  const macro = insight.macroCards || data?.macro || [];
  return <div className="grid gap-4">
    <Card><div className="text-sm font-black text-growth">오늘의 경제 한 줄 판단</div><div className="mt-2 text-xl font-black leading-relaxed">{insight.oneLine || insight.marketConclusion?.summary || "경제지표 스냅샷을 확인합니다."}</div><div className="mt-3 flex flex-wrap gap-2">{(insight.badges || []).map((b: Row, i: number) => <Badge key={i}>{b.label}: {b.value}</Badge>)}</div></Card>
    <div className="grid gap-3 lg:grid-cols-2"><List title="시장 지수 요약" rows={indices} /><List title="거시지표 요약" rows={macro} /></div>
  </div>;
}

function List({ title, rows }: { title: string; rows?: Row[] }) {
  return <Card><h2 className="text-xl font-black">{title}</h2><div className="mt-3 grid gap-2">{(rows || []).map((r, i) => <a key={i} href={r.url || "#"} target="_blank" className="rounded-lg bg-white/[0.04] p-3"><div className="flex justify-between gap-3"><b>{r.name || r.title || r.keyword}</b><span className={tone(r.changeRate)}>{pct(r.changeRate)}</span></div><div className="mt-1 text-lg font-black text-growth">{r.value || ""} {r.unit || ""}</div><p className="mt-1 text-xs text-muted">{r.read || r.reason || r.source || r.impact || ""}</p>{r.sectors ? <p className="mt-1 text-xs text-sky-100">관련섹터: {r.sectors}</p> : null}</a>)}</div></Card>;
}

function Overseas({ data }: { data?: Row }) {
  const sections: Array<[string, Row[]]> = [["미국 주요 지수", data?.indices || []], ["빅테크/AI 핵심 종목", data?.bigtech || []], ["해외 섹터 ETF", data?.etfs || []], ["금리·달러·원자재", data?.macro || []], ["해외 핵심 이슈 TOP 5", data?.newsTop5 || []], ["국내 연결 섹터 TOP 5", data?.domesticSectors || []]];
  return <div className="grid gap-4"><Card><h2 className="text-xl font-black">해외시장 결론</h2><div className="mt-3 grid gap-2 sm:grid-cols-2">{Object.entries(data?.conclusion || {}).map(([k, v]) => <Info key={k} label={k} value={String(v)} />)}</div></Card>{sections.map(([t, rows]) => <List key={t} title={t} rows={rows} />)}</div>;
}

function ThemeRow({ row, rank }: { row: Row; rank?: number }) {
  return <a href={row.url || row.naverUrl || row.naverNewsUrl || "#"} target="_blank" className="block rounded-lg bg-white/[0.04] p-3"><div className="flex justify-between gap-3"><b>{rank ? `${rank}. ` : ""}{row.theme || row.keyword || row.title}</b><Badge>{row.group || row.category || row.status || "관심"}</Badge></div><p className="mt-1 text-sm text-muted">{row.title || row.reason || row.tradeRead || "관련 흐름 확인"}</p><p className="mt-1 text-xs text-sky-100">{textOf(row.relatedStocks)}</p></a>;
}
function FutureThemes({ themes }: { themes?: Record<string, Row[]> }) {
  const groups = Object.entries(themes || {});
  const top = groups.flatMap(([group, rows]) => (rows || []).map(r => ({ ...r, group }))).slice(0, 5);
  return <div className="grid gap-4"><Card><h2 className="text-xl font-black">오늘 관심도 TOP 5</h2><div className="mt-3 grid gap-2">{top.map((r, i) => <ThemeRow key={i} row={r} rank={i + 1} />)}</div></Card>{groups.map(([g, rows]) => <details key={g} className="rounded-lg border border-line bg-panel/90 p-4"><summary className="cursor-pointer text-lg font-black text-growth">{g}</summary><div className="mt-3 grid gap-2">{(rows || []).map((r, i) => <ThemeRow key={i} row={{ ...r, group: g }} />)}</div></details>)}</div>;
}
function Issues({ issues, block }: { issues?: Record<string, Row[]>; block?: Row }) {
  const rows = block?.items || Object.entries(issues || {}).flatMap(([cat, list]) => (list || []).map(r => ({ ...r, category: cat })));
  return <div className="grid gap-4"><Card><h2 className="text-xl font-black">오늘의 전체 이슈 TOP 10</h2><div className="mt-3 grid gap-2">{rows.slice(0, 10).map((r: Row, i: number) => <ThemeRow key={i} row={r} rank={i + 1} />)}</div></Card>{Object.entries(issues || {}).map(([cat, list]) => <details key={cat} className="rounded-lg border border-line bg-panel/90 p-4"><summary className="cursor-pointer text-lg font-black text-growth">{cat} TOP {(list || []).length}</summary><div className="mt-3 grid gap-2">{(list || []).map((r, i) => <ThemeRow key={i} row={{ ...r, group: cat }} />)}</div></details>)}</div>;
}
function StockGrid({ rows }: { rows?: Row[] }) { return <div className="grid gap-3 md:grid-cols-2">{(rows || []).map((r, i) => <StockCard key={`${r.code}-${i}`} row={r} />)}</div>; }
function PricePicks({ data }: { data?: Data["pricePicks"] }) { return <StockGrid rows={[...(data?.low || []), ...(data?.high || [])].slice(0, 20)} />; }
function Names({ data }: { data?: Data }) {
  const groups: Array<[string, Row[]]> = [["핵심", data?.core || []], ["급등", data?.surge || []], ["단기", data?.short || []], ["장기", data?.long || []], ["가격대 후보", [...(data?.pricePicks?.low || []), ...(data?.pricePicks?.high || [])]]];
  return <div className="grid gap-4">{groups.map(([label, rows]) => <Card key={label}><h2 className="text-xl font-black">{label}</h2><div className="mt-3 grid gap-2">{rows.slice(0, 10).map(r => <a key={`${label}-${r.code}`} href={stockUrl(r)} target="_blank" className="flex justify-between gap-3 rounded-lg bg-white/[0.04] p-3"><span><b>{r.name}</b> <span className="text-xs text-muted">{r.code}</span><br /><span className="text-xs text-muted">{r.decision || r.actionLabel}</span></span><span className="text-right"><b>{nf(r.currentPrice || r.price)}원</b><br /><span className={`text-xs font-black ${tone(r.changeRate)}`}>{pct(r.changeRate)}</span></span></a>)}</div></Card>)}</div>;
}
function DailyRecords({ records = [] }: { records?: Row[] }) {
  const sorted = [...records].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const [date, setDate] = useState(sorted[0]?.date || "");
  const selected = sorted.find(d => d.date === date) || sorted[0];
  return <div className="grid gap-4"><Card><h2 className="text-xl font-black">일일기록</h2><p className="mt-1 text-sm text-muted">메모 저장은 Cloudflare 실시간 앱에서 가능하고, 이 화면은 배포 스냅샷을 표시합니다.</p><div className="mt-3 flex gap-2 overflow-x-auto pb-1">{sorted.map(d => <button key={d.date} type="button" onClick={() => setDate(d.date || "")} className={`min-h-10 shrink-0 rounded-lg border px-3 text-sm font-black ${d.date === selected?.date ? "border-growth bg-growth text-slate-950" : "border-line bg-white/[0.04]"}`}>{d.date}{String(d.note || "").trim() ? " · 메모" : ""}</button>)}</div></Card>{selected ? <Card><h3 className="text-lg font-black">{selected.dateKo || selected.date}</h3><p className="mt-1 text-sm text-muted">기준일 {selected.basisDateKo || selected.basisDate || "-"} · {selected.note ? `메모: ${selected.note}` : "메모 없음"}</p><div className="mt-3 grid gap-3">{Object.entries(selected.groups || {}).map(([g, rows]) => <details key={g} className="rounded-lg border border-line bg-white/[0.03] p-3" open={g === "핵심추천"}><summary className="cursor-pointer font-black">{g === "핵심추천" ? "핵심" : g} {(rows as Row[]).length}개</summary><div className="mt-2 grid gap-2">{(rows as Row[]).map(r => <StockCard key={`${g}-${r.code}`} row={r} />)}</div></details>)}</div></Card> : null}</div>;
}

export default function DeployablePlanner({ mobileSummary = false }: { mobileSummary?: boolean }) {
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState("경제지표");
  const [error, setError] = useState("");
  useEffect(() => { fetch("/data/app-data.json", { cache: "no-store" }).then(r => { if (!r.ok) throw new Error(`데이터 로딩 실패: ${r.status}`); return r.json(); }).then(setData).catch(e => setError(e.message)); }, []);
  const dashboardRows = useMemo(() => data ? [...(data.core || []), ...(data.surge || []), ...((data.pricePicks?.low || []) as Row[])].slice(0, 12) : [], [data]);
  if (error) return <main className="mx-auto max-w-3xl px-4 py-8"><Card><h1 className="text-2xl font-black">데이터를 불러오지 못했습니다</h1><p className="mt-2 text-muted">{error}</p></Card></main>;
  if (!data) return <main className="mx-auto max-w-3xl px-4 py-8"><Card><h1 className="text-2xl font-black">로딩 중...</h1><p className="mt-2 text-muted">배포 데이터를 확인하고 있습니다.</p></Card></main>;
  return <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8"><header className="rounded-lg border border-line bg-panel/80 p-4"><p className="text-sm font-black text-growth">국내주식 정보 우선 플래너</p><h1 className="mt-1 text-3xl font-black text-ink">국내주식 스윙 투자 기록장</h1><p className="mt-2 text-sm text-muted">데이터 기준 {data.updatedAt || "-"} · PC가 꺼져도 열리는 Vercel 배포 화면</p></header><nav className="flex gap-2 overflow-x-auto pb-1">{tabs.map(item => <button key={item} type="button" onClick={() => setTab(item)} className={`min-h-11 shrink-0 rounded-lg border px-4 text-sm font-black ${tab === item ? "border-growth bg-growth text-slate-950" : "border-line bg-panel"}`}>{item}</button>)}</nav>{tab === "경제지표" ? <Economics data={data.economics} /> : null}{tab === "해외시장 흐름" ? <Overseas data={data.overseas} /> : null}{tab === "미래테마" ? <FutureThemes themes={data.futureThemes} /> : null}{tab === "이슈흐름" ? <Issues issues={data.issues} block={data.commonNews?.issues} /> : null}{Object.entries(stockTabs).map(([label, key]) => tab === label ? <StockGrid key={label} rows={data[key] as Row[]} /> : null)}{tab === "가격대 후보" ? <PricePicks data={data.pricePicks} /> : null}{tab === "추천 종목 요약" ? <Names data={data} /> : null}{tab === "일일기록" ? <DailyRecords records={data.dailyRecords} /> : null}{mobileSummary ? <div className="hidden">{dashboardRows.length}</div> : null}</main>;
}
