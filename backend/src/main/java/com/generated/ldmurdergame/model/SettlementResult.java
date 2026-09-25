package com.generated.ldmurdergame.model;

import java.math.BigDecimal;

public record SettlementResult(
  String id,
  String memberId,
  String memberName,
  String originalLevel,
  String newLevel,
  boolean levelUpgraded,
  BigDecimal discount,
  String discountLabel,
  BigDecimal originalAmount,
  BigDecimal discountedAmount,
  long pointsUsed,
  BigDecimal pointsDeduction,
  BigDecimal actualReceived,
  long pointsEarned,
  long remainingPoints,
  BigDecimal totalSpend,
  String settledAt
) {
}
