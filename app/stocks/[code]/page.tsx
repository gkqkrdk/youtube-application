export default function StockDetailPage({ params }: { params: { code: string } }) {
  const code = params.code.replace(/[^0-9]/g, "").padStart(6, "0").slice(-6);
  const url = `https://finance.naver.com/item/main.naver?code=${code}`;

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <section className="rounded-lg border border-line bg-panel/90 p-5">
        <p className="text-sm font-black text-growth">종목 상세</p>
        <h1 className="mt-2 text-2xl font-black">{code}</h1>
        <p className="mt-2 text-sm text-muted">배포용 정적 화면에서는 상세 실시간 API 대신 네이버증권 원문으로 연결합니다.</p>
        <a className="mt-4 inline-flex rounded-lg bg-growth px-4 py-2 font-black text-slate-950" href={url}>
          네이버증권에서 보기
        </a>
      </section>
    </main>
  );
}
