import type { Reservation } from "@/types/reservation";
import { BRANCH_STORE_ID } from "@/lib/storeId";

interface MockSample {
  time: string;
  start_minutes: number;
  guest_name: string;
  adult_count: number;
  child_count?: number;
  infant_count?: number;
  seat: string;
}

const MOCK_SAMPLES: MockSample[] = [
  { time: "11:30:00", start_minutes: 690, guest_name: "김다민", adult_count: 5, seat: "r3" },
  { time: "12:00:00", start_minutes: 720, guest_name: "이영희", adult_count: 2, child_count: 1, seat: "t1" },
  { time: "12:30:00", start_minutes: 750, guest_name: "박철수", adult_count: 4, seat: "r5" },
  { time: "17:00:00", start_minutes: 1020, guest_name: "최민수", adult_count: 3, child_count: 2, seat: "v2" },
  { time: "17:30:00", start_minutes: 1050, guest_name: "박서연지우나", adult_count: 6, seat: "R4-1,4-2" },
  { time: "18:00:00", start_minutes: 1080, guest_name: "한지우", adult_count: 2, seat: "t3" },
  {
    time: "18:30:00",
    start_minutes: 1110,
    guest_name: "오세훈",
    adult_count: 4,
    child_count: 1,
    infant_count: 1,
    seat: "r7",
  },
  { time: "19:00:00", start_minutes: 1140, guest_name: "윤서준", adult_count: 8, seat: "v1" },
  { time: "19:30:00", start_minutes: 1170, guest_name: "남궁민수현우", adult_count: 3, seat: "r2" },
  { time: "20:00:00", start_minutes: 1200, guest_name: "독고영재훈", adult_count: 5, child_count: 2, seat: "t2" },
  { time: "20:30:00", start_minutes: 1230, guest_name: "선우자영미", adult_count: 2, seat: "r4" },
  { time: "21:00:00", start_minutes: 1260, guest_name: "배준호", adult_count: 4, seat: "v3" },
  { time: "11:00:00", start_minutes: 660, guest_name: "조은별", adult_count: 3, seat: "t4" },
  { time: "11:45:00", start_minutes: 705, guest_name: "황보서연지", adult_count: 7, seat: "r6" },
  { time: "12:15:00", start_minutes: 735, guest_name: "노지훈", adult_count: 2, child_count: 2, seat: "v4" },
  { time: "17:15:00", start_minutes: 1035, guest_name: "문채원", adult_count: 4, seat: "r8" },
];

/** 로컬 dev 전용 — 2호점 현황판 미리보기용 (Supabase 미사용) */
export function getMockBranchBoardReservations(dateKey: string): Reservation[] {
  const now = new Date().toISOString();

  return MOCK_SAMPLES.map((sample, index) => ({
    id: `mock-branch-${index}`,
    store_id: BRANCH_STORE_ID,
    date: dateKey,
    time: sample.time,
    guest_name: sample.guest_name,
    seat: sample.seat,
    memo: null,
    adult_count: sample.adult_count,
    child_count: sample.child_count ?? 0,
    infant_count: sample.infant_count ?? 0,
    party_separator: null,
    start_minutes: sample.start_minutes,
    duration_minutes: 60,
    color: null,
    created_at: now,
    updated_at: now,
  }));
}
