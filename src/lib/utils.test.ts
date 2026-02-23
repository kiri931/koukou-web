import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("p-2", "text-sm", "p-4")).toBe("text-sm p-4");
  });
});
