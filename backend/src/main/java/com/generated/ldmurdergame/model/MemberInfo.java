package com.generated.ldmurdergame.model;

import java.math.BigDecimal;

public record MemberInfo(
  String id,
  String name,
  String level,
  String levelName,
  BigDecimal discount,
  String discountLabel,
  BigDecimal totalSpend,
  long points
) {
}
