package com.generated.ldmurdergame.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;
import com.generated.ldmurdergame.model.MemberInfo;
import com.generated.ldmurdergame.model.MemberLevel;

@Service
public class MemberService {
  private final Map<String, MemberAccount> accounts = new ConcurrentHashMap<>();

  public MemberService() {
    seed(new MemberAccount("M1001", "张伟", "320", 260));
    seed(new MemberAccount("M1002", "王芳", "1600", 1450));
    seed(new MemberAccount("M1003", "李强", "4200", 800));
    seed(new MemberAccount("M1004", "赵敏", "9600", 5200));
  }

  private void seed(MemberAccount account) {
    accounts.put(account.id, account);
  }

  public List<MemberInfo> list() {
    return accounts.values().stream()
      .sorted((left, right) -> left.id.compareTo(right.id))
      .map(MemberAccount::snapshot)
      .toList();
  }

  public Optional<MemberAccount> find(String memberId) {
    return Optional.ofNullable(accounts.get(memberId));
  }

  public static final class MemberAccount {
    private final String id;
    private final String name;
    private BigDecimal totalSpend;
    private long points;

    MemberAccount(String id, String name, String totalSpend, long points) {
      this.id = id;
      this.name = name;
      this.totalSpend = new BigDecimal(totalSpend);
      this.points = points;
    }

    public String id() {
      return id;
    }

    public String name() {
      return name;
    }

    public synchronized BigDecimal totalSpend() {
      return totalSpend;
    }

    public synchronized long points() {
      return points;
    }

    public synchronized MemberInfo snapshot() {
      MemberLevel level = MemberLevel.of(totalSpend);
      return new MemberInfo(id, name, level.name(), level.label(), level.discount(),
        level.discountLabel(), totalSpend, points);
    }

    public synchronized void apply(BigDecimal received, long pointsDelta) {
      totalSpend = totalSpend.add(received);
      points += pointsDelta;
    }
  }
}
