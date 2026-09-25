package com.generated.ldmurdergame.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Service;
import com.generated.ldmurdergame.exception.ApiException;
import com.generated.ldmurdergame.model.MemberLevel;
import com.generated.ldmurdergame.model.SettlementRequest;
import com.generated.ldmurdergame.model.SettlementResult;
import com.generated.ldmurdergame.service.MemberService.MemberAccount;

@Service
public class SettlementService {
  private static final BigDecimal POINTS_PER_BLOCK = new BigDecimal("100");
  private static final BigDecimal BLOCK_VALUE = new BigDecimal("10");
  private static final int RECENT_LIMIT = 10;

  private final MemberService memberService;
  private final ConcurrentLinkedDeque<SettlementResult> recent = new ConcurrentLinkedDeque<>();
  private final AtomicLong sequence = new AtomicLong();

  public SettlementService(MemberService memberService) {
    this.memberService = memberService;
  }

  public List<SettlementResult> recent() {
    return List.copyOf(recent);
  }

  public SettlementResult settle(SettlementRequest request) {
    if (request == null || request.memberId() == null || request.memberId().isBlank()) {
      throw new ApiException("请先选择要结算的会员。");
    }
    MemberAccount member = memberService.find(request.memberId())
      .orElseThrow(() -> new ApiException("未找到所选会员，请刷新会员列表后重试。"));

    BigDecimal amount = normalizeAmount(request.amount());

    synchronized (member) {
      long pointsToUse = normalizePoints(request.pointsToUse(), member.points());
      MemberLevel originalLevel = MemberLevel.of(member.totalSpend());
      BigDecimal discounted = amount.multiply(originalLevel.discount())
        .setScale(2, RoundingMode.HALF_UP);

      long requestedBlocks = pointsToUse / POINTS_PER_BLOCK.intValue();
      long affordableBlocks = discounted.divideToIntegralValue(BLOCK_VALUE).longValue();
      long usedBlocks = Math.min(requestedBlocks, affordableBlocks);
      long pointsUsed = usedBlocks * POINTS_PER_BLOCK.longValue();
      BigDecimal deduction = BLOCK_VALUE.multiply(BigDecimal.valueOf(usedBlocks));

      BigDecimal received = discounted.subtract(deduction).setScale(2, RoundingMode.HALF_UP);
      long pointsEarned = received.setScale(0, RoundingMode.FLOOR).longValue();

      member.apply(received, pointsEarned - pointsUsed);

      MemberLevel newLevel = MemberLevel.of(member.totalSpend());
      SettlementResult result = new SettlementResult(
        "STL-" + sequence.incrementAndGet(),
        member.id(),
        member.name(),
        originalLevel.label(),
        newLevel.label(),
        newLevel.ordinal() > originalLevel.ordinal(),
        originalLevel.discount(),
        originalLevel.discountLabel(),
        amount,
        discounted,
        pointsUsed,
        deduction,
        received,
        pointsEarned,
        member.points(),
        member.totalSpend(),
        LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
      );
      recent.addFirst(result);
      while (recent.size() > RECENT_LIMIT) {
        recent.pollLast();
      }
      return result;
    }
  }

  private BigDecimal normalizeAmount(BigDecimal amount) {
    if (amount == null) {
      throw new ApiException("请录入消费金额。");
    }
    if (amount.compareTo(BigDecimal.ZERO) <= 0) {
      throw new ApiException("消费金额必须大于 0 元。");
    }
    return amount.setScale(2, RoundingMode.HALF_UP);
  }

  private long normalizePoints(BigDecimal pointsToUse, long availablePoints) {
    if (pointsToUse == null) {
      return 0;
    }
    if (pointsToUse.compareTo(BigDecimal.ZERO) < 0) {
      throw new ApiException("抵扣积分不能为负数。");
    }
    if (pointsToUse.remainder(BigDecimal.ONE).compareTo(BigDecimal.ZERO) != 0) {
      throw new ApiException("抵扣积分必须为整数。");
    }
    if (pointsToUse.compareTo(BigDecimal.valueOf(availablePoints)) > 0) {
      throw new ApiException("抵扣积分超过会员当前可用积分（当前 " + availablePoints + " 分），积分不能扣成负数。");
    }
    return pointsToUse.longValueExact();
  }
}
