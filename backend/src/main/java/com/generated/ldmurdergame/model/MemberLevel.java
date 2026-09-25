package com.generated.ldmurdergame.model;

import java.math.BigDecimal;

public enum MemberLevel {
  BRONZE("青铜", "0", "1.00", "无折扣"),
  SILVER("白银", "1000", "0.95", "95折"),
  GOLD("黄金", "3000", "0.90", "9折"),
  DIAMOND("钻石", "8000", "0.85", "85折");

  private final String label;
  private final BigDecimal threshold;
  private final BigDecimal discount;
  private final String discountLabel;

  MemberLevel(String label, String threshold, String discount, String discountLabel) {
    this.label = label;
    this.threshold = new BigDecimal(threshold);
    this.discount = new BigDecimal(discount);
    this.discountLabel = discountLabel;
  }

  public String label() {
    return label;
  }

  public BigDecimal threshold() {
    return threshold;
  }

  public BigDecimal discount() {
    return discount;
  }

  public String discountLabel() {
    return discountLabel;
  }

  public static MemberLevel of(BigDecimal totalSpend) {
    MemberLevel matched = BRONZE;
    for (MemberLevel level : values()) {
      if (totalSpend.compareTo(level.threshold) >= 0) {
        matched = level;
      }
    }
    return matched;
  }
}
