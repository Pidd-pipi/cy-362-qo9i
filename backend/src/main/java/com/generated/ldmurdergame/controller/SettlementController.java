package com.generated.ldmurdergame.controller;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import com.generated.ldmurdergame.model.MemberInfo;
import com.generated.ldmurdergame.model.SettlementRequest;
import com.generated.ldmurdergame.model.SettlementResult;
import com.generated.ldmurdergame.service.MemberService;
import com.generated.ldmurdergame.service.SettlementService;

@RestController
public class SettlementController {
  private final MemberService memberService;
  private final SettlementService settlementService;

  public SettlementController(MemberService memberService, SettlementService settlementService) {
    this.memberService = memberService;
    this.settlementService = settlementService;
  }

  @GetMapping({"/members", "/api/members"})
  public List<MemberInfo> members() {
    return memberService.list();
  }

  @GetMapping({"/settlements", "/api/settlements"})
  public List<SettlementResult> recentSettlements() {
    return settlementService.recent();
  }

  @PostMapping({"/settlements", "/api/settlements"})
  public SettlementResult settle(@RequestBody SettlementRequest request) {
    return settlementService.settle(request);
  }
}
