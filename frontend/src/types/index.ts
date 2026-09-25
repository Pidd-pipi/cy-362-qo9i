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

export interface MemberInfo {
  id: string;
  name: string;
  level: string;
  levelName: string;
  discount: number;
  discountLabel: string;
  totalSpend: number;
  points: number;
}

export interface SettlementPayload {
  memberId: string;
  amount: number;
  pointsToUse: number;
}

export interface SettlementResult {
  id: string;
  memberId: string;
  memberName: string;
  originalLevel: string;
  newLevel: string;
  levelUpgraded: boolean;
  discount: number;
  discountLabel: string;
  originalAmount: number;
  discountedAmount: number;
  pointsUsed: number;
  pointsDeduction: number;
  actualReceived: number;
  pointsEarned: number;
  remainingPoints: number;
  totalSpend: number;
  settledAt: string;
}
