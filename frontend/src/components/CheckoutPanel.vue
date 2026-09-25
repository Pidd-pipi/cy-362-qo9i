<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { createSettlement, fetchMembers, fetchRecentSettlements } from "../api/client";
import { CHECKOUT_MESSAGES } from "../constants/messages";
import type { MemberInfo, SettlementResult } from "../types";

const members = ref<MemberInfo[]>([]);
const recentRecords = ref<SettlementResult[]>([]);
const selectedMemberId = ref<string>();
const amount = ref<number>();
const pointsToUse = ref<number>(0);
const submitting = ref(false);
const errorMessage = ref("");
const result = ref<SettlementResult>();

const selectedMember = computed(() =>
  members.value.find((member) => member.id === selectedMemberId.value),
);

function levelTagType(levelName: string): "info" | "primary" | "warning" | "success" {
  switch (levelName) {
    case "白银":
      return "primary";
    case "黄金":
      return "warning";
    case "钻石":
      return "success";
    default:
      return "info";
  }
}

function money(value: number): string {
  return `¥${value.toFixed(2)}`;
}

async function reloadData() {
  const [memberList, records] = await Promise.all([fetchMembers(), fetchRecentSettlements()]);
  members.value = memberList;
  recentRecords.value = records;
}

function validateForm(): string {
  if (!selectedMemberId.value) {
    return CHECKOUT_MESSAGES.selectMember;
  }
  if (amount.value === undefined || amount.value === null) {
    return CHECKOUT_MESSAGES.amountRequired;
  }
  if (amount.value <= 0) {
    return CHECKOUT_MESSAGES.amountPositive;
  }
  const points = pointsToUse.value ?? 0;
  if (points < 0) {
    return CHECKOUT_MESSAGES.pointsNegative;
  }
  if (!Number.isInteger(points)) {
    return CHECKOUT_MESSAGES.pointsInteger;
  }
  if (selectedMember.value && points > selectedMember.value.points) {
    return CHECKOUT_MESSAGES.pointsExceeded;
  }
  return "";
}

async function submit() {
  errorMessage.value = "";
  const invalidReason = validateForm();
  if (invalidReason) {
    errorMessage.value = invalidReason;
    return;
  }
  submitting.value = true;
  try {
    result.value = await createSettlement({
      memberId: selectedMemberId.value as string,
      amount: amount.value as number,
      pointsToUse: pointsToUse.value ?? 0,
    });
    amount.value = undefined;
    pointsToUse.value = 0;
    await reloadData();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error);
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  try {
    await reloadData();
  } catch {
    errorMessage.value = CHECKOUT_MESSAGES.loadFailed;
  }
});
</script>

<template>
  <section class="work-panel checkout-panel" aria-label="前台收银结算">
    <h2>前台收银结算</h2>
    <p class="checkout-tip">
      选择会员后录入消费金额与要抵扣的积分：先按会员等级打折，再按每 100 积分抵 10 元，
      抵扣不超过应付金额，积分不会扣成负数。
    </p>

    <div class="checkout-grid">
      <div class="checkout-form">
        <el-form label-position="top" @submit.prevent="submit">
          <el-form-item label="结算会员">
            <el-select
              v-model="selectedMemberId"
              placeholder="请选择会员"
              filterable
              style="width: 100%"
            >
              <el-option
                v-for="member in members"
                :key="member.id"
                :value="member.id"
                :label="`${member.name}（${member.levelName} · 积分 ${member.points}）`"
              />
            </el-select>
          </el-form-item>

          <div v-if="selectedMember" class="member-brief">
            <el-tag :type="levelTagType(selectedMember.levelName)" effect="dark">
              {{ selectedMember.levelName }}
            </el-tag>
            <span>折扣：{{ selectedMember.discountLabel }}</span>
            <span>累计消费：{{ money(selectedMember.totalSpend) }}</span>
            <span>可用积分：{{ selectedMember.points }}</span>
          </div>

          <el-form-item label="消费金额（元）">
            <el-input-number
              v-model="amount"
              :min="0"
              :precision="2"
              :step="50"
              :controls="false"
              placeholder="录入本次消费金额"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item label="抵扣积分（每 100 积分抵 10 元）">
            <el-input-number
              v-model="pointsToUse"
              :min="0"
              :precision="0"
              :step="100"
              placeholder="录入要抵扣的积分"
              style="width: 100%"
            />
          </el-form-item>

          <el-button type="primary" size="large" :loading="submitting" @click="submit">
            结算
          </el-button>
        </el-form>

        <el-alert
          v-if="errorMessage"
          class="checkout-error"
          type="error"
          :title="errorMessage"
          :closable="false"
          show-icon
        />
      </div>

      <div class="checkout-result">
        <template v-if="result">
          <div class="result-head">
            <span class="pill">结算成功</span>
            <el-tag v-if="result.levelUpgraded" type="success" effect="dark">
              升级：{{ result.originalLevel }} → {{ result.newLevel }}
            </el-tag>
          </div>
          <dl class="result-grid">
            <div>
              <dt>原等级</dt>
              <dd>{{ result.originalLevel }}</dd>
            </div>
            <div>
              <dt>新等级</dt>
              <dd>{{ result.newLevel }}</dd>
            </div>
            <div>
              <dt>折扣</dt>
              <dd>{{ result.discountLabel }}</dd>
            </div>
            <div>
              <dt>折后应付</dt>
              <dd>{{ money(result.discountedAmount) }}</dd>
            </div>
            <div>
              <dt>积分抵扣</dt>
              <dd>{{ result.pointsUsed }} 分 / -{{ money(result.pointsDeduction) }}</dd>
            </div>
            <div>
              <dt>实收</dt>
              <dd class="result-strong">{{ money(result.actualReceived) }}</dd>
            </div>
            <div>
              <dt>本次积分</dt>
              <dd>+{{ result.pointsEarned }}</dd>
            </div>
            <div>
              <dt>剩余积分</dt>
              <dd>{{ result.remainingPoints }}</dd>
            </div>
          </dl>
        </template>
        <p v-else class="result-empty">结算后在此显示原等级、新等级、折扣、实收、本次积分与剩余积分。</p>
      </div>
    </div>

    <div class="checkout-history">
      <h3>最近结算记录</h3>
      <el-table :data="recentRecords" style="width: 100%" size="large" empty-text="暂无结算记录">
        <el-table-column prop="settledAt" label="时间" min-width="150" />
        <el-table-column prop="memberName" label="会员" min-width="90" />
        <el-table-column label="等级变化" min-width="130">
          <template #default="{ row }">
            {{ row.originalLevel }} → {{ row.newLevel }}
          </template>
        </el-table-column>
        <el-table-column prop="discountLabel" label="折扣" min-width="80" />
        <el-table-column label="消费金额" min-width="100">
          <template #default="{ row }">{{ money(row.originalAmount) }}</template>
        </el-table-column>
        <el-table-column label="积分抵扣" min-width="110">
          <template #default="{ row }">{{ row.pointsUsed }} 分 / -{{ money(row.pointsDeduction) }}</template>
        </el-table-column>
        <el-table-column label="实收" min-width="100">
          <template #default="{ row }">{{ money(row.actualReceived) }}</template>
        </el-table-column>
        <el-table-column label="本次积分" min-width="90">
          <template #default="{ row }">+{{ row.pointsEarned }}</template>
        </el-table-column>
        <el-table-column prop="remainingPoints" label="剩余积分" min-width="90" />
      </el-table>
    </div>
  </section>
</template>
