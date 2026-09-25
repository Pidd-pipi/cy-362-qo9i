import type { LevelCode, LevelRule } from "../types";

/** 会员等级：累计消费达到 1000 / 3000 / 8000 依次为白银 / 黄金 / 钻石，青铜不打折 */
export const LEVEL_RULES: LevelRule[] = [
  { code: "DIAMOND", name: "钻石", threshold: 8000, rate: 0.85, discountLabel: "85折" },
  { code: "GOLD", name: "黄金", threshold: 3000, rate: 0.9, discountLabel: "9折" },
  { code: "SILVER", name: "白银", threshold: 1000, rate: 0.95, discountLabel: "95折" },
  { code: "BRONZE", name: "青铜", threshold: 0, rate: 1, discountLabel: "不打折" },
];

/** 每 100 积分抵扣 10 元，即 1 积分抵 0.1 元 */
export const POINTS_PER_UNIT = 100;
export const DEDUCTION_PER_UNIT = 10;

/** 1 元实收奖励 1 积分 */
export const REWARD_RATE = 1;

/** 页面保留的最近结算记录条数 */
export const RECENT_RECORD_LIMIT = 10;

/** 单次消费金额上限，避免误输入天文数字 */
export const MAX_AMOUNT = 1_000_000;

export function levelOf(totalSpent: number): LevelRule {
  return LEVEL_RULES.find((rule) => totalSpent >= rule.threshold) ?? LEVEL_RULES[LEVEL_RULES.length - 1];
}

export function levelName(code: LevelCode): string {
  return LEVEL_RULES.find((rule) => rule.code === code)?.name ?? code;
}

export type LevelTagType = "" | "success" | "info" | "warning" | "danger";

export function levelTagType(code: LevelCode): LevelTagType {
  switch (code) {
    case "DIAMOND":
      return "danger";
    case "GOLD":
      return "warning";
    case "SILVER":
      return "success";
    default:
      return "info";
  }
}
