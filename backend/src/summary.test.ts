import { describe, expect, it } from "vitest";

function calculateSummary(entries: { amount: number; repaid: boolean; dueDate: string }[], today: string) {
  return entries.reduce((summary, entry) => {
    summary.totalLent += entry.amount;
    if (entry.repaid) summary.totalRepaid += entry.amount;
    else if (entry.dueDate < today) summary.overdueAmount += entry.amount;
    return summary;
  }, { totalLent: 0, totalRepaid: 0, overdueAmount: 0 });
}

describe("summary calculation rules", () => {
  it("totals lent, repaid and overdue independently", () => {
    expect(calculateSummary([
      { amount: 100, repaid: false, dueDate: "2026-10-01" },
      { amount: 50, repaid: true, dueDate: "2026-10-01" },
      { amount: 25, repaid: false, dueDate: "2026-10-21" }
    ], "2026-10-21")).toEqual({ totalLent: 175, totalRepaid: 50, overdueAmount: 100 });
  });
  it("does not count a loan due today as overdue", () => {
    expect(calculateSummary([{ amount: 20, repaid: false, dueDate: "2026-10-21" }], "2026-10-21").overdueAmount).toBe(0);
  });
});
