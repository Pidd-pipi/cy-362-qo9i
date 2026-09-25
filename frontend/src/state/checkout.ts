import { ref } from "vue";
import {
  DEDUCTION_PER_UNIT,
  MAX_AMOUNT,
  POINTS_PER_UNIT,
  REWARD_RATE,
  RECENT_RECORD_LIMIT,
  levelOf,
} from "../constants/membership";
import type { LevelCode, Member, SettlementResult } from "../types";

const MEMBERS_STORAGE_KEY = "ldmurdergame:cashier:members:v1";
const RECORDS_STORAGE_KEY = "ldmurdergame:cashier:records:v1";

/** 示例会员：覆盖四个等级与即将升级的临界情况 */
function seedMembers(): Member[] {
  return [
    { memberNo: "M001", name: "张小明", totalSpent: 180, points: 150 },
    { memberNo: "M002", name: "林晚晴", totalSpent: 640, points: 680 },
    { memberNo: "M003", name: "周泽言", totalSpent: 1280, points: 1250 },
    { memberNo: "M004", name: "苏雨桐", totalSpent: 2650, points: 2400 },
    { memberNo: "M005", name: "陈一诺", totalSpent: 5200, points: 4300 },
    { memberNo: "M006", name: "顾北辰", totalSpent: 9200, points: 8600 },
  ];
}

function loadMembers(): Member[] {
  try {
    const raw = localStorage.getItem(MEMBERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Member[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // 存储损坏时回退到示例数据
  }
  return seedMembers();
}

function loadRecords(): SettlementResult[] {
  try {
    const raw = localStorage.getItem(RECORDS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SettlementResult[];
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // 存储损坏时忽略
  }
  return [];
}

export const members = ref<Member[]>(loadMembers());
export const recentRecords = ref<SettlementResult[]>(loadRecords());

function persistMembers() {
  localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(members.value));
}

function persistRecords() {
  localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(recentRecords.value));
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export interface SettlementInput {
  member: Member;
  amount: number;
  redeemPoints: number;
}

export interface SettlementPreview {
  oldLevel: LevelCode;
  discountRate: number;
  payableAfterDiscount: number;
  maxUsablePoints: number;
  plannedDeduction: number;
  actualPaid: number;
  earnedPoints: number;
}

/**
 * 试算（不改动会员数据）：
 * 1. 按原等级打折；2. 按每 100 积分抵 10 元计算抵扣，抵扣不超过应付金额。
 */
export function previewSettlement(member: Member, amount: number, redeemPoints: number): SettlementPreview {
  const oldLevel = levelOf(member.totalSpent);
  const payableAfterDiscount = round2(amount * oldLevel.rate);

  // 同时受三个上限约束：积分余额、100 的整数倍、应付金额对应的抵扣额度
  const cappedByBalance = Math.min(redeemPoints, member.points);
  const cappedByPayableUnits = Math.floor(payableAfterDiscount / DEDUCTION_PER_UNIT) * POINTS_PER_UNIT;
  const usablePoints = Math.min(cappedByBalance, cappedByPayableUnits);
  const maxUsablePoints = Math.min(member.points, cappedByPayableUnits);

  const plannedDeduction = round2((usablePoints / POINTS_PER_UNIT) * DEDUCTION_PER_UNIT);
  const actualPaid = round2(payableAfterDiscount - plannedDeduction);
  const earnedPoints = Math.floor(actualPaid * REWARD_RATE);

  return {
    oldLevel: oldLevel.code,
    discountRate: oldLevel.rate,
    payableAfterDiscount,
    maxUsablePoints,
    plannedDeduction,
    actualPaid,
    earnedPoints,
  };
}

function createRecordId(): string {
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `SET-${stamp}-${rand}`;
}

/**
 * 校验并执行结算。
 * 金额或积分不合法时抛出带原因的 Error；成功后更新会员累计消费、积分并记录流水。
 */
export function settle(input: SettlementInput): SettlementResult {
  const { member, amount, redeemPoints } = input;

  if (!Number.isFinite(amount) || Number.isNaN(amount)) {
    throw new Error("消费金额必须是有效数字。");
  }
  if (amount <= 0) {
    throw new Error("消费金额必须大于 0 元。");
  }
  if (round2(amount) !== amount) {
    throw new Error("消费金额最多保留两位小数（精确到分）。");
  }
  if (amount > MAX_AMOUNT) {
    throw new Error(`单笔消费金额不能超过 ${MAX_AMOUNT.toLocaleString()} 元。`);
  }

  if (!Number.isInteger(redeemPoints)) {
    throw new Error("抵扣积分必须是整数。");
  }
  if (redeemPoints < 0) {
    throw new Error("抵扣积分不能为负数。");
  }
  if (redeemPoints > member.points) {
    throw new Error(`抵扣积分不能超过会员当前积分（当前余额 ${member.points} 分）。`);
  }
  if (redeemPoints % POINTS_PER_UNIT !== 0) {
    throw new Error(`每 ${POINTS_PER_UNIT} 积分抵 ${DEDUCTION_PER_UNIT} 元，抵扣积分必须是 ${POINTS_PER_UNIT} 的整数倍。`);
  }

  const oldLevelRule = levelOf(member.totalSpent);
  const payableAfterDiscount = round2(amount * oldLevelRule.rate);

  const cappedByPayableUnits = Math.floor(payableAfterDiscount / DEDUCTION_PER_UNIT) * POINTS_PER_UNIT;
  if (redeemPoints > cappedByPayableUnits) {
    throw new Error(
      `抵扣后不能超过应付金额 ${payableAfterDiscount.toFixed(2)} 元，本单最多可抵 ${cappedByPayableUnits} 积分（${round2(
        (cappedByPayableUnits / POINTS_PER_UNIT) * DEDUCTION_PER_UNIT,
      ).toFixed(2)} 元）。`,
    );
  }

  const deductedAmount = round2((redeemPoints / POINTS_PER_UNIT) * DEDUCTION_PER_UNIT);
  const actualPaid = round2(payableAfterDiscount - deductedAmount);
  if (actualPaid < 0) {
    throw new Error("抵扣金额不能超过应付金额。");
  }

  // 实际收到的钱计入累计消费，并按 1 元 1 分奖励
  const newTotalSpent = round2(member.totalSpent + actualPaid);
  const earnedPoints = Math.floor(actualPaid * REWARD_RATE);
  const remainingPoints = member.points - redeemPoints + earnedPoints;
  if (remainingPoints < 0) {
    throw new Error("扣除后积分不能为负数，请减少抵扣积分。");
  }

  const newLevelRule = levelOf(newTotalSpent);

  const result: SettlementResult = {
    id: createRecordId(),
    settledAt: new Date().toISOString(),
    memberNo: member.memberNo,
    memberName: member.name,
    amount: round2(amount),
    oldLevel: oldLevelRule.code,
    newLevel: newLevelRule.code,
    discountLabel: oldLevelRule.discountLabel,
    rate: oldLevelRule.rate,
    payableAfterDiscount,
    redeemedPoints: redeemPoints,
    deductedAmount,
    actualPaid,
    earnedPoints,
    remainingPoints,
    upgraded: newLevelRule.code !== oldLevelRule.code,
  };

  member.totalSpent = newTotalSpent;
  member.points = remainingPoints;
  persistMembers();

  recentRecords.value = [result, ...recentRecords.value].slice(0, RECENT_RECORD_LIMIT);
  persistRecords();

  return result;
}

/** 恢复示例会员数据并清空结算记录 */
export function resetDemoData() {
  members.value = seedMembers();
  recentRecords.value = [];
  persistMembers();
  persistRecords();
}
