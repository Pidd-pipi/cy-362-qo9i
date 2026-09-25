import { API_BASE_URL } from "../constants/app";
import type { MemberInfo, OverviewResponse, SettlementPayload, SettlementResult } from "../types";

export async function fetchOverview(): Promise<OverviewResponse> {
  const response = await fetch(`${API_BASE_URL}/overview`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Overview request failed: ${response.status}`);
  }

  return response.json() as Promise<OverviewResponse>;
}

export async function fetchMembers(): Promise<MemberInfo[]> {
  const response = await fetch(`${API_BASE_URL}/members`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Members request failed: ${response.status}`);
  }

  return response.json() as Promise<MemberInfo[]>;
}

export async function fetchRecentSettlements(): Promise<SettlementResult[]> {
  const response = await fetch(`${API_BASE_URL}/settlements`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Settlements request failed: ${response.status}`);
  }

  return response.json() as Promise<SettlementResult[]>;
}

export async function createSettlement(payload: SettlementPayload): Promise<SettlementResult> {
  const response = await fetch(`${API_BASE_URL}/settlements`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = `结算请求失败（${response.status}）`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) {
        message = body.message;
      }
    } catch {
      // 保留默认错误提示
    }
    throw new Error(message);
  }

  return response.json() as Promise<SettlementResult>;
}
