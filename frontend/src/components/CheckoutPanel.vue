<script setup lang="ts">
import { computed, ref } from "vue";
import {
  DEDUCTION_PER_UNIT,
  POINTS_PER_UNIT,
  levelName,
  levelOf,
  levelTagType,
} from "../constants/membership";
import {
  members,
  previewSettlement,
  recentRecords,
  resetDemoData,
  settle,
} from "../state/checkout";
import type { Member, SettlementResult } from "../types";

const selectedMemberNo = ref<string>("");
const amountText = ref("");
const redeemPointsText = ref("0");
const errorMessage = ref("");
const lastResult = ref<SettlementResult | null>(null);

const selectedMember = computed<Member | undefined>(() =>
  members.value.find((member) => member.memberNo === selectedMemberNo.value),
);

const currentLevel = computed(() =>
  selectedMember.value ? levelOf(selectedMember.value.totalSpent) : null,
);

const parsedAmount = computed(() => {
  const trimmed = amountText.value.trim();
  if (trimmed === "") {
    return null;
  }
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : NaN;
});

const parsedRedeemPoints = computed(() => {
  const trimmed = redeemPointsText.value.trim();
  if (trimmed === "") {
    return null;
  }
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : NaN;
});

const preview = computed(() => {
  if (!selectedMember.value) {
    return null;
  }
  const amount = parsedAmount.value;
  const points = parsedRedeemPoints.value;
  if (amount === null || amount === undefined || Number.isNaN(amount) || amount <= 0) {
    return null;
  }
  const safePoints =
    points === null || points === undefined || Number.isNaN(points) || points < 0 ? 0 : points;
  return previewSettlement(selectedMember.value, amount, safePoints);
});

function clearError() {
  errorMessage.value = "";
}

function formatMoney(value: number): string {
  return `¥${value.toFixed(2)}`;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function memberLabel(member: Member): string {
  return `${member.memberNo} ${member.name}`;
}

function handleSettle() {
  clearError();

  if (!selectedMember.value) {
    errorMessage.value = "请先选择要结算的会员。";
    return;
  }

  const amount = parsedAmount.value;
  if (amount === null) {
    errorMessage.value = "请录入消费金额。";
    return;
  }
  if (Number.isNaN(amount)) {
    errorMessage.value = "消费金额必须是有效数字。";
    return;
  }

  const points = parsedRedeemPoints.value;
  if (points === null) {
    errorMessage.value = "请录入要抵扣的积分（不抵扣请填 0）。";
    return;
  }
  if (Number.isNaN(points)) {
    errorMessage.value = "抵扣积分必须是有效数字。";
    return;
  }

  try {
    lastResult.value = settle({
      member: selectedMember.value,
      amount,
      redeemPoints: points,
    });
    // 结算成功后清空录入项，会员选择保留以便连续收银
    amountText.value = "";
    redeemPointsText.value = "0";
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "结算失败，请检查录入内容。";
    lastResult.value = null;
  }
}

function handleReset() {
  resetDemoData();
  selectedMemberNo.value = "";
  amountText.value = "";
  redeemPointsText.value = "0";
  errorMessage.value = "";
  lastResult.value = null;
}
</script>

<template>
  <section class="work-panel cashier-panel">
    <div class="cashier-heading">
      <div>
        <h2>前台收银结算</h2>
        <p class="cashier-subtitle">
          先按会员等级打折，再按每 {{ POINTS_PER_UNIT }} 积分抵 {{ DEDUCTION_PER_UNIT }}
          元；实际收款计入累计消费，并按 1 元 1 分奖励积分。
        </p>
      </div>
      <el-button size="small" plain @click="handleReset">重置示例数据</el-button>
    </div>

    <div class="cashier-grid">
      <!-- 左侧：录入表单 -->
      <el-form label-position="top" class="cashier-form" @submit.prevent>
        <el-form-item label="选择会员">
          <el-select
            v-model="selectedMemberNo"
            placeholder="请选择会员"
            filterable
            style="width: 100%"
            @change="clearError"
          >
            <el-option
              v-for="member in members"
              :key="member.memberNo"
              :label="memberLabel(member)"
              :value="member.memberNo"
            />
          </el-select>
        </el-form-item>

        <div v-if="selectedMember && currentLevel" class="member-card">
          <div class="member-card-row">
            <span class="member-card-label">当前等级</span>
            <el-tag :type="levelTagType(currentLevel.code)" effect="dark">
              {{ currentLevel.name }}
            </el-tag>
            <span class="member-discount">（{{ currentLevel.discountLabel }}）</span>
          </div>
          <div class="member-card-row">
            <span class="member-card-label">累计消费</span>
            <strong>{{ formatMoney(selectedMember.totalSpent) }}</strong>
          </div>
          <div class="member-card-row">
            <span class="member-card-label">可用积分</span>
            <strong>{{ selectedMember.points }} 分</strong>
          </div>
          <div class="member-card-hint">
            升级线：白银 ¥1,000 · 黄金 ¥3,000 · 钻石 ¥8,000
          </div>
        </div>

        <el-form-item label="消费金额（元）">
          <el-input
            v-model="amountText"
            type="number"
            inputmode="decimal"
            placeholder="请录入本次消费金额"
            :min="0"
            :step="0.01"
            @input="clearError"
          />
        </el-form-item>

        <el-form-item label="要抵扣的积分">
          <el-input
            v-model="redeemPointsText"
            type="number"
            inputmode="numeric"
            placeholder="不抵扣请填 0"
            :min="0"
            :step="POINTS_PER_UNIT"
            @input="clearError"
          />
          <div class="field-hint">
            每 {{ POINTS_PER_UNIT }} 积分抵 {{ DEDUCTION_PER_UNIT }}
            元，需为 {{ POINTS_PER_UNIT }} 的整数倍
            <template v-if="preview">，本单最多可抵 {{ preview.maxUsablePoints }} 分</template>
          </div>
        </el-form-item>

        <el-alert
          v-if="errorMessage"
          :title="errorMessage"
          type="error"
          show-icon
          :closable="false"
          class="cashier-alert"
        />

        <el-button type="primary" size="large" class="settle-button" @click="handleSettle">
          确认结算
        </el-button>
      </el-form>

      <!-- 右侧：试算与结算结果 -->
      <div class="cashier-side">
        <div class="preview-card">
          <h3>实时试算</h3>
          <template v-if="preview">
            <dl class="preview-list">
              <div class="preview-item">
                <dt>原等级 / 折扣</dt>
                <dd>
                  {{ levelName(preview.oldLevel) }} ·
                  {{ preview.discountRate === 1 ? "不打折" : `${preview.discountRate * 10}折` }}
                </dd>
              </div>
              <div class="preview-item">
                <dt>折后应付</dt>
                <dd>{{ formatMoney(preview.payableAfterDiscount) }}</dd>
              </div>
              <div class="preview-item">
                <dt>预计积分抵扣</dt>
                <dd>{{ formatMoney(preview.plannedDeduction) }}</dd>
              </div>
              <div class="preview-item highlight">
                <dt>预计实收</dt>
                <dd>{{ formatMoney(preview.actualPaid) }}</dd>
              </div>
              <div class="preview-item">
                <dt>预计奖励积分</dt>
                <dd>+{{ preview.earnedPoints }} 分</dd>
              </div>
            </dl>
          </template>
          <p v-else class="preview-empty">选择会员并录入消费金额后，这里会实时显示折扣与抵扣试算。</p>
        </div>

        <el-alert
          v-if="lastResult"
          :title="lastResult.upgraded ? '结算成功，会员已升级！' : '结算成功'"
          :type="lastResult.upgraded ? 'success' : 'info'"
          show-icon
          :closable="false"
          class="cashier-alert"
        />

        <div v-if="lastResult" class="result-card">
          <h3>本次结算结果</h3>
          <div class="result-levels">
            <div class="result-level">
              <span class="result-level-label">原等级</span>
              <el-tag :type="levelTagType(lastResult.oldLevel)" effect="plain">
                {{ levelName(lastResult.oldLevel) }}
              </el-tag>
            </div>
            <span class="result-arrow">→</span>
            <div class="result-level">
              <span class="result-level-label">新等级</span>
              <el-tag :type="levelTagType(lastResult.newLevel)" effect="dark">
                {{ levelName(lastResult.newLevel) }}
              </el-tag>
              <el-tag v-if="lastResult.upgraded" type="danger" size="small" effect="dark" class="upgrade-tag">
                升级
              </el-tag>
            </div>
          </div>
          <dl class="result-grid">
            <div>
              <dt>折扣</dt>
              <dd>{{ lastResult.discountLabel }}</dd>
            </div>
            <div>
              <dt>实收</dt>
              <dd class="strong-money">{{ formatMoney(lastResult.actualPaid) }}</dd>
            </div>
            <div>
              <dt>本次积分</dt>
              <dd class="points-earned">+{{ lastResult.earnedPoints }} 分</dd>
            </div>
            <div>
              <dt>剩余积分</dt>
              <dd>{{ lastResult.remainingPoints }} 分</dd>
            </div>
          </dl>
          <dl class="result-detail">
            <div>
              <dt>消费金额</dt>
              <dd>{{ formatMoney(lastResult.amount) }}</dd>
            </div>
            <div>
              <dt>折后应付</dt>
              <dd>{{ formatMoney(lastResult.payableAfterDiscount) }}</dd>
            </div>
            <div>
              <dt>抵扣积分 / 金额</dt>
              <dd>
                {{ lastResult.redeemedPoints }} 分 / {{ formatMoney(lastResult.deductedAmount) }}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>

    <!-- 最近结算记录 -->
    <div class="records-block">
      <h3>最近结算记录</h3>
      <el-table :data="recentRecords" size="small" class="records-table" empty-text="暂无结算记录">
        <el-table-column label="时间" min-width="170">
          <template #default="{ row }">{{ formatTime(row.settledAt) }}</template>
        </el-table-column>
        <el-table-column label="会员" min-width="120">
          <template #default="{ row }">{{ row.memberNo }} {{ row.memberName }}</template>
        </el-table-column>
        <el-table-column label="原等级 → 新等级" min-width="150">
          <template #default="{ row }">
            {{ levelName(row.oldLevel) }} →
            <strong :class="{ 'level-up': row.upgraded }">{{ levelName(row.newLevel) }}</strong>
            <el-tag v-if="row.upgraded" type="danger" size="small" effect="dark" class="upgrade-tag">
              升级
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="discountLabel" label="折扣" min-width="80" />
        <el-table-column label="消费金额" min-width="100" align="right">
          <template #default="{ row }">{{ formatMoney(row.amount) }}</template>
        </el-table-column>
        <el-table-column label="抵扣积分" min-width="90" align="right">
          <template #default="{ row }">{{ row.redeemedPoints }} 分</template>
        </el-table-column>
        <el-table-column label="实收" min-width="100" align="right">
          <template #default="{ row }">
            <strong>{{ formatMoney(row.actualPaid) }}</strong>
          </template>
        </el-table-column>
        <el-table-column label="本次积分" min-width="90" align="right">
          <template #default="{ row }">+{{ row.earnedPoints }}</template>
        </el-table-column>
        <el-table-column label="剩余积分" min-width="90" align="right">
          <template #default="{ row }">{{ row.remainingPoints }} 分</template>
        </el-table-column>
      </el-table>
    </div>
  </section>
</template>

<style scoped>
.cashier-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.cashier-heading h2 {
  margin: 0 0 6px;
}

.cashier-subtitle {
  margin: 0;
  color: color-mix(in srgb, #19212e 65%, #3268b8 35%);
  line-height: 1.6;
}

.cashier-grid {
  display: grid;
  grid-template-columns: minmax(300px, 0.9fr) minmax(320px, 1.1fr);
  gap: clamp(18px, 3vw, 32px);
  margin-top: 22px;
}

.member-card {
  margin: -6px 0 18px;
  padding: 14px 16px;
  border: 1px solid color-mix(in srgb, #3268b8 30%, transparent);
  border-radius: 8px;
  background: color-mix(in srgb, #3268b8 7%, white 93%);
}

.member-card-row {
  display: flex;
  align-items: center;
  gap: 10px;
  line-height: 1.9;
}

.member-card-label {
  display: inline-block;
  width: 72px;
  color: color-mix(in srgb, #19212e 65%, transparent);
  font-size: 13px;
}

.member-discount {
  color: color-mix(in srgb, #19212e 65%, transparent);
  font-size: 13px;
}

.member-card-hint {
  margin-top: 6px;
  padding-top: 8px;
  border-top: 1px dashed color-mix(in srgb, #19212e 18%, transparent);
  font-size: 12px;
  color: color-mix(in srgb, #19212e 55%, transparent);
}

.field-hint {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.5;
  color: color-mix(in srgb, #19212e 55%, transparent);
}

.cashier-alert {
  margin: 4px 0 14px;
}

.settle-button {
  width: 100%;
}

.preview-card,
.result-card {
  border: 1px solid color-mix(in srgb, #19212e 13%, transparent);
  border-radius: 8px;
  padding: 18px 20px;
  background: color-mix(in srgb, #f4f7fb 60%, white 40%);
}

.preview-card h3,
.result-card h3,
.records-block h3 {
  margin: 0 0 14px;
  font-size: 16px;
}

.preview-list,
.result-grid,
.result-detail {
  margin: 0;
}

.preview-item,
.result-grid > div,
.result-detail > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 0;
  border-bottom: 1px dashed color-mix(in srgb, #19212e 12%, transparent);
}

.preview-item dt,
.result-grid dt,
.result-detail dt {
  color: color-mix(in srgb, #19212e 62%, transparent);
  font-size: 13px;
}

.preview-item dd,
.result-grid dd,
.result-detail dd {
  margin: 0;
  font-weight: 600;
}

.preview-item.highlight dd {
  color: #cf5c36;
  font-size: 20px;
  font-weight: 800;
}

.preview-empty {
  margin: 0;
  color: color-mix(in srgb, #19212e 50%, transparent);
  font-size: 13px;
  line-height: 1.7;
}

.result-card {
  margin-top: 14px;
  border-color: color-mix(in srgb, #cf5c36 35%, transparent);
}

.result-levels {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 14px;
  padding: 12px 14px;
  border-radius: 8px;
  background: color-mix(in srgb, #3268b8 8%, white 92%);
}

.result-level {
  display: flex;
  align-items: center;
  gap: 8px;
}

.result-level-label {
  font-size: 13px;
  color: color-mix(in srgb, #19212e 62%, transparent);
}

.result-arrow {
  font-size: 18px;
  color: #cf5c36;
  font-weight: 800;
}

.upgrade-tag {
  margin-left: 4px;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 22px;
}

.result-grid > div {
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.strong-money {
  color: #cf5c36;
  font-size: 20px;
  font-weight: 800;
}

.points-earned {
  color: #2f7d4f;
}

.result-detail {
  margin-top: 10px;
}

.records-block {
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid color-mix(in srgb, #19212e 12%, transparent);
}

.records-table {
  width: 100%;
}

.level-up {
  color: #cf5c36;
}

@media (max-width: 860px) {
  .cashier-grid,
  .result-grid {
    grid-template-columns: 1fr;
  }
}
</style>
