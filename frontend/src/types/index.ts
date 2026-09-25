export interface FeatureItem {
  id: number;
  title: string;
  description: string;
  status: string;
  metric: string;
}

export interface KpiItem {
  label: string;
  value: string;
  trend: string;
  tone: string;
}

export interface OperationRecord {
  key: string;
  name: string;
  owner: string;
  status: string;
  metric: string;
  priority: string;
}

export interface OverviewResponse {
  appName: string;
  appCode: string;
  description: string;
  features: FeatureItem[];
  kpis: KpiItem[];
  records: OperationRecord[];
}

export type LevelCode = "BRONZE" | "SILVER" | "GOLD" | "DIAMOND";

export interface LevelRule {
  code: LevelCode;
  name: string;
  threshold: number;
  rate: number;
  discountLabel: string;
}

export interface Member {
  memberNo: string;
  name: string;
  totalSpent: number;
  points: number;
}

export interface SettlementResult {
  id: string;
  settledAt: string;
  memberNo: string;
  memberName: string;
  amount: number;
  oldLevel: LevelCode;
  newLevel: LevelCode;
  discountLabel: string;
  rate: number;
  payableAfterDiscount: number;
  redeemedPoints: number;
  deductedAmount: number;
  actualPaid: number;
  earnedPoints: number;
  remainingPoints: number;
  upgraded: boolean;
}
