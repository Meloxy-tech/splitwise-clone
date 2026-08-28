import { describe, it, expect } from "vitest";
import { simplifyDebts, computeBalances, type Balance } from "../src/lib/debt-simplify";

describe("simplifyDebts", () => {
  it("returns no transactions when everyone is settled", () => {
    const balances: Balance[] = [
      { userId: "a", amount: 0 },
      { userId: "b", amount: 0 },
    ];
    expect(simplifyDebts(balances)).toEqual([]);
  });

  it("handles a simple two-person debt", () => {
    const balances: Balance[] = [
      { userId: "a", amount: -50 },
      { userId: "b", amount: 50 },
    ];
    const result = simplifyDebts(balances);
    expect(result).toEqual([{ fromUserId: "a", toUserId: "b", amount: 50 }]);
  });

  it("reduces a three-person cycle to the minimum transactions", () => {
    // a owes 30, b owes 10, c is owed 40 total.
    const balances: Balance[] = [
      { userId: "a", amount: -30 },
      { userId: "b", amount: -10 },
      { userId: "c", amount: 40 },
    ];
    const result = simplifyDebts(balances);
    expect(result).toHaveLength(2);
    const total = result.reduce((sum, t) => sum + t.amount, 0);
    expect(total).toBeCloseTo(40, 2);
  });

  it("never produces more transactions than (members - 1)", () => {
    const balances: Balance[] = [
      { userId: "a", amount: -120 },
      { userId: "b", amount: 45 },
      { userId: "c", amount: -30 },
      { userId: "d", amount: 60 },
      { userId: "e", amount: 45 },
    ];
    const result = simplifyDebts(balances);
    expect(result.length).toBeLessThanOrEqual(balances.length - 1);
  });

  it("leaves every account net-zero after applying the transactions", () => {
    const balances: Balance[] = [
      { userId: "a", amount: -70.5 },
      { userId: "b", amount: 20.25 },
      { userId: "c", amount: 50.25 },
    ];
    const result = simplifyDebts(balances);

    const net = new Map(balances.map((b) => [b.userId, b.amount]));
    for (const t of result) {
      net.set(t.fromUserId, (net.get(t.fromUserId) ?? 0) + t.amount);
      net.set(t.toUserId, (net.get(t.toUserId) ?? 0) - t.amount);
    }
    for (const amount of net.values()) {
      expect(Math.abs(amount)).toBeLessThan(0.01);
    }
  });

  it("ignores floating point dust under a cent", () => {
    const balances: Balance[] = [
      { userId: "a", amount: -0.001 },
      { userId: "b", amount: 0.001 },
    ];
    expect(simplifyDebts(balances)).toEqual([]);
  });
});

describe("computeBalances", () => {
  it("computes correct net balances from expenses and splits", () => {
    // Expense 1: a pays 90, split equally among a, b, c (30 each)
    const expenses = [{ paidById: "a", amount: 90 }];
    const splits = [
      { userId: "a", shareAmount: 30, expensePaidById: "a" },
      { userId: "b", shareAmount: 30, expensePaidById: "a" },
      { userId: "c", shareAmount: 30, expensePaidById: "a" },
    ];
    const balances = computeBalances(expenses, splits);
    const byUser = Object.fromEntries(balances.map((b) => [b.userId, b.amount]));
    expect(byUser.a).toBeCloseTo(60, 2); // paid 90, owes 30
    expect(byUser.b).toBeCloseTo(-30, 2);
    expect(byUser.c).toBeCloseTo(-30, 2);
  });
});
