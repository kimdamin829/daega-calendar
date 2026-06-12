export function SetupNotice() {
  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-3 text-xl font-medium text-[#3c4043]">한우대가 예약</h1>
      <p className="mb-4 text-sm leading-6 text-gcal-gray">
        Supabase 환경 변수가 설정되지 않았습니다. <code className="text-[#3c4043]">web/.env</code>{" "}
        파일을 만들고 아래 값을 채운 뒤 개발 서버를 다시 실행하세요.
      </p>
      <pre className="overflow-x-auto rounded-lg bg-[#f8f9fa] p-4 text-xs text-[#3c4043]">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`}
      </pre>
      <p className="mt-4 text-sm text-gcal-gray">
        Supabase SQL Editor에서 <code className="text-[#3c4043]">supabase/migrations/001_reservations.sql</code>{" "}
        을 실행해 테이블을 만드세요.
      </p>
    </div>
  );
}
