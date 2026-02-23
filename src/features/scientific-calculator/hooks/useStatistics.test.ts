import { act, renderHook } from "@testing-library/react";
import { useStatistics } from "./useStatistics";

describe("useStatistics", () => {
  it("initializes with empty values and zeroed stats", () => {
    const { result } = renderHook(() => useStatistics());

    expect(result.current.draft).toBe("");
    expect(result.current.values).toEqual([]);
    expect(result.current.stats).toEqual({ n: 0, mean: 0, stddev: 0 });
  });

  it("adds a value from draft and clears draft", () => {
    const { result } = renderHook(() => useStatistics());

    act(() => {
      result.current.setDraft("42");
    });

    let added = false;
    act(() => {
      added = result.current.addValue();
    });

    expect(added).toBe(true);
    expect(result.current.draft).toBe("");
    expect(result.current.values).toEqual([42]);
  });

  it("calculates n, mean, and stddev from added values", () => {
    const { result } = renderHook(() => useStatistics());

    let count = 0;
    act(() => {
      count = result.current.addMany("2 4 4 4 5 5 7 9");
    });

    expect(count).toBe(8);
    expect(result.current.stats.n).toBe(8);
    expect(result.current.stats.mean).toBe(5);
    expect(result.current.stats.stddev).toBeCloseTo(2, 10);
  });

  it("returns false and keeps state unchanged when draft is invalid", () => {
    const { result } = renderHook(() => useStatistics());

    act(() => {
      result.current.setDraft("abc");
    });

    let added = true;
    act(() => {
      added = result.current.addValue();
    });

    expect(added).toBe(false);
    expect(result.current.draft).toBe("abc");
    expect(result.current.values).toEqual([]);
    expect(result.current.stats).toEqual({ n: 0, mean: 0, stddev: 0 });
  });

  it("adds only finite values from mixed input in addMany", () => {
    const { result } = renderHook(() => useStatistics());

    let count = 0;
    act(() => {
      count = result.current.addMany("1 abc 3 NaN");
    });

    expect(count).toBe(2);
    expect(result.current.values).toEqual([1, 3]);
    expect(result.current.stats).toEqual({ n: 2, mean: 2, stddev: 1 });
  });

  it("removes a value at index and updates the list", () => {
    const { result } = renderHook(() => useStatistics());

    act(() => {
      result.current.addMany("10,20,30");
    });

    act(() => {
      result.current.removeValueAt(1);
    });

    expect(result.current.values).toEqual([10, 30]);
    expect(result.current.stats).toEqual({ n: 2, mean: 20, stddev: 10 });
  });

  it("returns to empty state after clearing values", () => {
    const { result } = renderHook(() => useStatistics());

    act(() => {
      result.current.addMany("1 2 3");
    });

    act(() => {
      result.current.clearValues();
    });

    expect(result.current.values).toEqual([]);
    expect(result.current.stats).toEqual({ n: 0, mean: 0, stddev: 0 });
  });
});
