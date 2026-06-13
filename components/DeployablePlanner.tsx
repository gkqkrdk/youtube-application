"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

type StockRow = {
  code?: string;
  name?: string;
  sector?: string;
  currentPrice?: number;
  price?: number;
  pickPrice?: number;
  changeRate?: number;
  changePct?: number;
  total?: number;
  score?: number;
  decision?: string;
  actionLabel?: string;
  stockUrl?: string;
  url?: string;
};

type NewsItem = {
  keyword?: string;
  title?: string;
  score?: number;
  status?: string;
  source?: string;
  date?: string;
  reason?: string;
  tradeRead?: string;
  naverNewsUrl?: string;
  youtubeUrl?: string;
};

type NewsBlock = {
  title?: string;
  updatedAt?: string;
  summary?: string;
  items?: NewsItem[];
};

type PlannerData = {
  dataSource?: string;
  updatedAt?: string;
  economics?: {
    indices?: Array<Record<string, string>>;
    macro?: Array<Record<string, string>>;
  };
  commonNews?: Record<string, NewsBlock>;
  core?: StockRow[];
  surge?: StockRow[];
  short?: StockRow[];
  long?: StockRow[];
  pricePicks?: { low?: StockRow[]; high?: StockRow[] };
  dailyRecords?: Array<{
    date?: string;
    dateKo?: string;
    basisDate?: string;
    basisDateKo?: string;
    note?: string;
    groups?: Record<string, StockRow[]>;
  }>;
};

const allTabs = ["대시보드", "경제지표", "이슈뉴스", "핵심", "급등", "단기", "장기", "가격대 후보", "일일기록"];
const stockTabs: Array<[string, keyof PlannerData]> = [["핵심", "core"], ["급등", "surge"], ["단기", "short"], ["장기", "long"]];

function money(value?: number) {
  return value ? Number(value).toLocaleString("ko-KR") : "-";
}

function price(row: StockRow) {
  return row.currentPrice || row.pickPrice || row.price || 0;
}

function score(row: StockRow) {
  return row.total || row.score || 0;
}

function rateText(value?: number) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return "";
  const n = Number(value);
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function rateClass(value?: number) {
  if ((value || 0) > 0) return "text-emerald-200";
  if ((value || 0) < 0) return "text-red-200";
  return "text-slate-300";
}

function stockUrl(row: StockRow) {
  return row.stockUrl || row.url || `https://finance.naver.com/item/main.naver?code=${row.code || ""}`;
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-line bg-panel/90 p-4 shadow-xl shadow-black/10 ${className}`}>{children}</section>;
}

function Badge({ children, className = "bg-white/10 text-slate-200" }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${className}`}>{children}</span>;
}

function StockCard({ row }: { row: StockRow }) {
  const liveRate = row.changeRate ?? row.changePct;
  return (
    <a href={stockUrl(row)} target="_blank" className="block rounded-lg border border-line bg-white/[0.04] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-lg font-black text-ink">{row.name || "종목명 확인"}</div>
          <div className="mt-1 text-xs text-muted">{row.code || "-"} · {row.sector || "섹터 확인"}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xl font-black text-growth">{score(row)}점</div>
          <div className="mt-1 text-sm font-bold">{money(price(row))}원</div>
          {rateText(liveRate) ? <div className={`text-xs font-black ${rateClass(liveRate)}`}>{rateText(liveRate)}</div> : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge className="bg-sky-400/15 text-sky-100">{row.actionLabel || row.decision || "판단 확인"}</Badge>
      </div>
    </a>
  );
}

function NewsCard({ item, rank }: { item: NewsItem; rank: number }) {
  return (
    <a href={item.naverNewsUrl || "#"} target="_blank" className="block rounded-lg border border-line bg-white/[0.04] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-muted">{item.date || ""} · {item.source || "뉴스"}</div>
          <div className="mt-1 font-black text-ink">{rank}. {item.title || item.keyword}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-lg font-black text-growth">{item.score || 0}</div>
          <Badge className="bg-teal-400/15 text-teal-100">{item.status || "참고"}</Badge>
        </div>
      </div>
      <p className="mt-2 text-sm text-muted">{item.reason || item.tradeRead || "관련 흐름 확인 필요"}</p>
    </a>
  );
}

function NewsSection({ block }: { block?: NewsBlock }) {
  const rows = block?.items || [];
  return (
    <Card>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-ink">{block?.title || "관심 뉴스"}</h2>
          <p className="mt-1 text-sm text-muted">{block?.summary || "오늘 관심도가 높은 뉴스를 확인합니다."}</p>
        </div>
        <Badge>{block?.updatedAt || "스냅샷"}</Badge>
      </div>
      <div className="mt-3 grid gap-2">{rows.slice(0, 5).map((item, index) => <NewsCard key={`${item.keyword}-${index}`} item={item} rank={index + 1} />)}</div>
      {rows.length > 5 ? (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-bold text-growth">뉴스 5개 더보기</summary>
          <div className="mt-2 grid gap-2">{rows.slice(5, 10).map((item, index) => <NewsCard key={`${item.keyword}-more-${index}`} item={item} rank={index + 6} />)}</div>
        </details>
      ) : null}
    </Card>
  );
}

function MacroList({ data }: { data?: PlannerData["economics"] }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Card>
        <h2 className="text-xl font-black">주요 지수</h2>
        <div className="mt-3 grid gap-2">{(data?.indices || []).map((item, index) => <div key={`${item.name}-${index}`} className="flex justify-between gap-3 rounded-lg bg-white/[0.04] p-3"><span><b>{item.name}</b><br /><span className="text-xs text-muted">{item.source}</span></span><b className="text-right">{item.value || "-"}<br /><span className="text-xs text-muted">{item.change || ""}</span></b></div>)}</div>
      </Card>
      <Card>
        <h2 className="text-xl font-black">거시지표</h2>
        <div className="mt-3 grid gap-2">{(data?.macro || []).slice(0, 12).map((item, index) => <a key={`${item.name}-${index}`} href={item.url || "#"} target="_blank" className="flex justify-between gap-3 rounded-lg bg-white/[0.04] p-3"><span><b>{item.name}</b><br /><span className="text-xs text-muted">{item.source}</span></span><b className="text-right">{item.value || "-"} {item.unit || ""}<br /><span className="text-xs text-muted">{item.date || ""}</span></b></a>)}</div>
      </Card>
    </div>
  );
}

function DailyRecords({ records = [] }: { records?: PlannerData["dailyRecords"] }) {
  const [date, setDate] = useState(records[0]?.date || "");
  const selected = records.find((item) => item.date === date) || records[0];
  return (
    <Card>
      <h2 className="text-xl font-black">일일기록</h2>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{records.map((item) => <button key={item.date} type="button" onClick={() => setDate(item.date || "")} className={`min-h-10 shrink-0 rounded-lg border px-3 text-sm font-black ${item.date === selected?.date ? "border-growth bg-growth text-slate-950" : "border-line bg-white/[0.04]"}`}>{item.date}</button>)}</div>
      {selected ? <div className="mt-4"><div className="text-sm text-muted">기준일 {selected.basisDate || "-"} · {selected.note ? `메모: ${selected.note}` : "메모 없음"}</div><div className="mt-3 grid gap-3">{Object.entries(selected.groups || {}).map(([group, rows]) => <details key={group} className="rounded-lg border border-line bg-white/[0.03] p-3" open={group === "가격대 후보"}><summary className="cursor-pointer font-black">{group} {rows.length}개</summary><div className="mt-2 grid gap-2">{rows.map((row) => <StockCard key={`${group}-${row.code}`} row={row} />)}</div></details>)}</div></div> : <p className="mt-3 text-muted">저장된 기록이 없습니다.</p>}
    </Card>
  );
}

export default function DeployablePlanner({ mobileSummary = false }: { mobileSummary?: boolean }) {
  const [data, setData] = useState<PlannerData | null>(null);
  const [tab, setTab] = useState("대시보드");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/data/app-data.json", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`스냅샷 로딩 실패: ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  const priceRows = useMemo(() => data?.pricePicks?.low || [], [data]);
  const dashboardRows = useMemo(() => data ? [...(data.core || []), ...(data.surge || []), ...priceRows].slice(0, 12) : [], [data, priceRows]);

  if (error) return <main className="mx-auto max-w-3xl px-4 py-8"><Card><h1 className="text-2xl font-black">데이터를 불러오지 못했습니다</h1><p className="mt-2 text-muted">{error}</p></Card></main>;
  if (!data) return <main className="mx-auto max-w-3xl px-4 py-8"><Card><h1 className="text-2xl font-black">로딩 중...</h1><p className="mt-2 text-muted">배포용 스냅샷을 확인하고 있습니다.</p></Card></main>;

  const pageTabs = mobileSummary ? ["대시보드", "가격대 후보", "일일기록"] : allTabs;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3 rounded-lg border border-line bg-panel/80 p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-sm font-black text-growth">PC가 꺼져도 열리는 배포용 화면</p><h1 className="mt-1 text-3xl font-black text-ink">국내주식 스윙 플래너</h1></div>
          <a href="/mobile-summary" className="rounded-lg bg-growth px-4 py-2 text-sm font-black text-slate-950">모바일 요약</a>
        </div>
        <p className="text-sm text-muted">데이터 기준 {data.updatedAt || "스냅샷"} · 데이터 소스 {data.dataSource || "static"} · 실시간 API 없이 정적 파일로 표시</p>
      </header>

      <nav className="flex gap-2 overflow-x-auto pb-1">{pageTabs.map((item) => <button key={item} type="button" onClick={() => setTab(item)} className={`min-h-11 shrink-0 rounded-lg border px-4 text-sm font-black ${tab === item ? "border-growth bg-growth text-slate-950" : "border-line bg-panel"}`}>{item}</button>)}</nav>

      {tab === "대시보드" ? <><section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Card><div className="text-sm text-muted">핵심</div><div className="mt-1 text-3xl font-black">{data.core?.length || 0}개</div></Card><Card><div className="text-sm text-muted">급등</div><div className="mt-1 text-3xl font-black">{data.surge?.length || 0}개</div></Card><Card><div className="text-sm text-muted">가격대 후보</div><div className="mt-1 text-3xl font-black">{priceRows.length}개</div></Card><Card><div className="text-sm text-muted">일일기록</div><div className="mt-1 text-3xl font-black">{data.dailyRecords?.length || 0}일</div></Card></section><NewsSection block={data.commonNews?.issues || data.commonNews?.economics} /><div className="grid gap-3 md:grid-cols-2">{dashboardRows.map((row) => <StockCard key={`dash-${row.code}`} row={row} />)}</div></> : null}
      {tab === "경제지표" ? <MacroList data={data.economics} /> : null}
      {tab === "이슈뉴스" ? <NewsSection block={data.commonNews?.issues} /> : null}
      {stockTabs.map(([label, key]) => tab === label ? <div key={label} className="grid gap-3 md:grid-cols-2">{((data[key] as StockRow[]) || []).map((row) => <StockCard key={`${label}-${row.code}`} row={row} />)}</div> : null)}
      {tab === "가격대 후보" ? <><Card><h2 className="text-xl font-black">5,000원~10,000원 후보 {priceRows.length}개</h2><p className="mt-1 text-sm text-muted">배포 스냅샷 기준 후보입니다. 실시간 갱신은 로컬/서버리스 API 전환 이후 붙일 수 있습니다.</p></Card><div className="grid gap-3 md:grid-cols-2">{priceRows.map((row) => <StockCard key={`price-${row.code}`} row={row} />)}</div></> : null}
      {tab === "일일기록" ? <DailyRecords records={data.dailyRecords} /> : null}
    </main>
  );
}
