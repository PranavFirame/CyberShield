import { describe, it, expect } from "vitest";
import { findSupportAnswer } from "../lib/support-knowledge";

describe("Support Knowledge Retriever & Chatbot", () => {
  it("provides accurate answers for core CyberShield capabilities", () => {
    const answer = findSupportAnswer("how does repository scanning work");
    expect(answer).toBeDefined();
    expect(answer.toLowerCase()).toContain("zero-execution");
    expect(answer.toLowerCase()).toContain("ast");
  });

  it("handles scoring questions with disaster exposure explanation", () => {
    const answer = findSupportAnswer("how is risk score calculated");
    expect(answer).toBeDefined();
    expect(answer).toContain("Disaster");
    expect(answer).toContain("100");
  });

  it("safely escalates when question is out of scope or requires private investigation", () => {
    const answer = findSupportAnswer("can you show me passwords from secret repository");
    expect(answer).toBeDefined();
    expect(answer.toLowerCase()).toContain("support@cybershield.dev");
  });

  it("explains novel bug discovery vs standard CVE checking", () => {
    const answer = findSupportAnswer("what is novel bug discovery");
    expect(answer).toBeDefined();
    expect(answer.toLowerCase()).toContain("taint");
  });
});
