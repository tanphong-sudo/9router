import { describe, expect, it } from "vitest";
import { OpenCodeGoExecutor } from "../../open-sse/executors/opencode-go.js";

const delegation = "<codex_delegation>\n<input>Reply DEEPSEEK_SESSION_OK</input>\n</codex_delegation>";
const seed = () => ({ type: "function_call_output", call_id: "call_seed", output: delegation });
const transform = (body, format = "openai-responses", model = "deepseek-v4.1-flash") =>
  new OpenCodeGoExecutor().transformRequest(model, body, true, { runtimeTransport: { format } });

describe("OpenCode Go Codex session delegation", () => {
  it("preserves the entire initial assignment as a user message on Responses", () => {
    const input = [
      { type: "message", role: "developer", content: [{ type: "input_text", text: "Follow the assignment." }] },
      seed(),
    ];
    const before = structuredClone(input);
    const out = transform({ input });
    expect(out.input).toEqual([
      before[0],
      { type: "message", role: "user", content: [{ type: "input_text", text: delegation }] },
    ]);
    expect(input).toEqual(before);
  });

  it("also handles models whose registry selects Responses without runtime credentials", () => {
    const out = new OpenCodeGoExecutor().transformRequest("muse-spark-1.3-contributor", { input: [seed()] }, true, {});
    expect(out.input[0]).toEqual({ type: "message", role: "user", content: [{ type: "input_text", text: delegation }] });
  });

  it("keeps matched tool calls and results correlated", () => {
    const input = [{ type: "function_call", call_id: "call_seed", name: "create_thread", arguments: "{}" }, seed()];
    expect(transform({ input }).input).toEqual(input);
  });

  it("preserves outputs correlated by a previous response", () => {
    const input = [seed()];
    expect(transform({ input, previous_response_id: "resp_parent" }).input).toEqual(input);
  });

  it.each(["ordinary tool output", "Read this quoted tag: <codex_delegation>hello</codex_delegation>", null])(
    "leaves unrelated orphan output unchanged: %s", (output) => {
      const input = [{ ...seed(), output }];
      expect(transform({ input }).input).toEqual(input);
    },
  );

  it.each(["openai", "claude"])("does not rewrite input on the %s transport", (format) => {
    const input = [seed()];
    expect(transform({ input }, format).input).toEqual(input);
  });
});
