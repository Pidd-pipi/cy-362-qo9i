export const REQUEST_MESSAGES = {
  overviewFallback: "已加载本地运营样例，后端联通后会自动展示实时数据。",
  healthPath: "/api/health",
};

export const CHECKOUT_MESSAGES = {
  loadFailed: "会员数据加载失败，请确认后端服务已启动。",
  selectMember: "请先选择要结算的会员。",
  amountRequired: "请录入消费金额。",
  amountPositive: "消费金额必须大于 0 元。",
  pointsNegative: "抵扣积分不能为负数。",
  pointsInteger: "抵扣积分必须为整数。",
  pointsExceeded: "抵扣积分超过会员当前可用积分，积分不能扣成负数。",
};
