package com.generated.ldmurdergame.model;

import java.math.BigDecimal;

public record SettlementRequest(
  String memberId,
  BigDecimal amount,
  BigDecimal pointsToUse
) {
}
