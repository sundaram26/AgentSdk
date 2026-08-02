# [sdk-name] — Testing, Examples, Benchmarks, Docs & Landing Page Plan

## 1. Monorepo restructure

The SDK itself moves under `packages/[sdk-name]/` (so it's the one thing actually published to npm), with everything else as sibling top-level folders.

```
[sdk-name]/                              # repo root
├── packages/
│   └── [sdk-name]/                      # ← your existing implementation moves here
│       ├── src/
│       ├── tests/                  # or colocated *.test.ts — see §2
│       └── package.json            # "name": "[sdk-name]", published to npm
│
├── examples/
│   ├── basic-agent/
│   ├── multi-agent-handoff/
│   ├── structured-output/
│   ├── streaming-chat/
│   └── package.json                # "private": true, depends on "[sdk-name]": "workspace:*"
│
├── benchmarks/
│   ├── suites/
│   │   ├── crud-generation/
│   │   └── guardrail-redteam/
│   ├── runners/
│   │   ├── [sdk-name]-runner.ts
│   │   └── openai-agents-runner.ts
│   ├── results/                    # committed output, linked from README + docs
│   └── package.json                # "private": true
│
├── docs/                           # Docusaurus/Mintlify project, not published
│   └── package.json                # "private": true
│
├── landing/                        # marketing site, not published
│   └── package.json                # "private": true
│
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

**`pnpm-workspace.yaml`**
```yaml
packages:
  - 'packages/*'
  - 'examples/*'
  - 'benchmarks'
  - 'docs'
  - 'landing'
```

Only `packages/[sdk-name]/package.json` should lack `"private": true` — everything else must have it set, or `pnpm publish` / `npm publish` could accidentally try to publish your examples or landing page.

---

## 2. Tests — inside `packages/[sdk-name]/`

**Step 1 — pick the layout.** Colocate `*.test.ts` next to the file it tests (e.g., `ToolRegistry.ts` + `ToolRegistry.test.ts` in the same folder). This is the more common TS convention and keeps a test change visible in the same diff as the code change it covers.

**Step 2 — build a `FakeLLMPort` test double first.** Before writing any other test, implement one fake adapter that returns scripted `LLMResponse` objects in sequence. Every state-machine and guardrail test depends on this — build it once, reuse everywhere:
```typescript
// packages/[sdk-name]/src/llm/adapters/FakeLLMPort.test-util.ts
class FakeLLMPort implements LLMPort {
  readonly providerName = "fake";
  private responses: LLMResponse[];
  private callIndex = 0;
  constructor(scriptedResponses: LLMResponse[]) { this.responses = scriptedResponses; }
  async complete() { return this.responses[this.callIndex++]; }
  async *stream() { /* yield scripted chunks, then done */ }
}
```

**Step 3 — unit tests, no network calls, run on every commit:**
- `RunStateMachine` — script a tool-call response then a final response; assert it walks Planning → Executing → Verifying → Done. Separately script a response requiring approval; assert it pauses in `AWAITING_APPROVAL` and `resume()` continues correctly.
- `GuardrailPipeline` + each built-in rule — feed known-bad inputs (a prompt-injection string, a PII-containing output) and assert the correct action (`block`/`reask`/`pause`).
- `StructuredOutputValidator` — feed a malformed JSON response, assert the repair-prompt error message is generated correctly and a second scripted (now-valid) response is accepted.
- `HandoffManager` — assert a handoff chain exceeding `maxHandoffDepth` fails cleanly instead of looping.
- `FallbackChain` — using two `FakeLLMPort`s where the first throws, assert it falls through to the second and the `Tracer` records the fallback.
- `ContextPruner` — both strategies, assert pinned messages survive pruning.

**Step 4 — integration tests, real API calls, gated:**
```typescript
describe.skipIf(!process.env.ANTHROPIC_API_KEY)("ClaudeAdapter (live)", () => {
  it("completes a simple prompt", async () => { /* real call */ });
  it("executes a tool call round-trip", async () => { /* real call */ });
});
```
Repeat per provider. These confirm the real API response shapes match what your adapters expect — this is where the tool-call-parsing question from earlier actually gets caught if it's wrong.

**Step 5 — CI (GitHub Actions), two jobs:**
- `test-unit` — runs on every push/PR, no secrets needed, must pass to merge.
- `test-integration` — runs only on `main` or manual dispatch, uses repo secrets for the 3 provider API keys, so PRs from forks can't drain your API budget.

**Step 6 — coverage badge.** `vitest run --coverage`, publish the badge in the root README. The number matters less than the badge existing.

---

## 3. Examples — top-level `examples/`

**Step 1 — one folder per capability**, each a minimal, runnable script:
- `basic-agent/` — single tool, single turn, `agent.run()`.
- `multi-agent-handoff/` — two agents, one handoff, printed trace of the transfer.
- `structured-output/` — a zod schema, deliberately trigger one repair cycle to show the self-repair message.
- `streaming-chat/` — `for await (const event of agent.stream(...))`, printing each event type as it arrives.

**Step 2 — each example gets its own tiny `README.md`** — what it demonstrates, the exact command to run it, and a short expected-output snippet. This is what a developer reads before touching your source.

**Step 3 — depend on the workspace package directly**, not a published version:
```json
{ "dependencies": { "[sdk-name]": "workspace:*" } }
```
This means examples always run against your current local code, never a stale npm release — critical while you're still iterating.

**Step 4 — link every example from the docs site's "Examples" page** rather than duplicating the code there; one source of truth.

---

## 4. Benchmarks — top-level `benchmarks/`

**Step 1 — define one fixed task**, identical across frameworks. Given your original use case: "given a JSON schema, generate a working CRUD API endpoint set." Write a deterministic validator that checks the generated output against fixed criteria (compiles, has expected routes, handles a sample request correctly) so "success" isn't a subjective judgment call.

**Step 2 — one runner script per framework** you're comparing against (start with just OpenAI Agents SDK — that's the most-adopted comparison point):
```
benchmarks/runners/[sdk-name]-runner.ts
benchmarks/runners/openai-agents-runner.ts
```
Each runner performs the same task and returns a common result shape: `{ success: boolean, totalTokens: number, latencyMs: number, toolCalls: number, retries: number }`.

**Step 3 — run N trials (5 is reasonable) per framework** to average out LLM response variance, since a single run's numbers are noise, not signal.

**Step 4 — separate suite for the guardrail red-team test:**
```
benchmarks/suites/guardrail-redteam/attacks.json   # 10-15 known prompt-injection / dangerous-tool-call strings
benchmarks/runners/guardrail-runner.ts             # feeds each through the pipeline, records catch/miss
```
Report the catch rate as a single number — this is the "receipt" for your guardrail feature specifically.

**Step 5 — commit results as both a machine-readable JSON and a rendered markdown table** in `benchmarks/results/`, and pull that table directly into your root README and the docs site — never restate the numbers by hand in two places.

---

## 5. Docs — top-level `docs/`

**Step 1 — pick the tool.** Mintlify if you want the fastest path to a hosted, good-looking site with minimal config; Docusaurus if you want full control and free GitHub Pages hosting with no vendor account.

**Step 2 — page list**, matching the assignment's documentation requirement exactly:
`installation.md`, `quickstart.md`, `api-reference.md`, `tools.md`, `handoffs.md`, `guardrails.md`, `memory-and-sessions.md`, `structured-output.md`, `streaming.md`, `tracing.md`, `error-handling.md`, `examples.md`.

**Step 3 — auto-generate the API reference** from your existing TSDoc comments using `typedoc`, rather than hand-writing it — hand-written reference docs drift out of sync with source within weeks.

**Step 4 — deploy** to GitHub Pages (Docusaurus) or Mintlify's hosting, under a custom subdomain if you have one available.

---

## 6. Landing page — top-level `landing/`

**Step 1 — keep it to one page.** Hero line, install snippet, 3–4 feature highlights (multi-provider fallback, guardrails, handoffs, structured output), and — prominently, above the fold if possible — the benchmark table from `benchmarks/results/`. This is the single highest-leverage piece of content on the page, per the earlier metrics discussion.

**Step 2 — plain static site is enough** (HTML/CSS, or a minimal Astro/Next.js site if you want component reuse with the docs site's theme). Don't over-invest in the landing page relative to the docs — it exists to convert a skimming visitor into someone who clicks through to the quickstart.

**Step 3 — deploy to Vercel's free tier.**

---

## 7. Suggested build order for this phase

1. `FakeLLMPort` test double, then unit tests for the state machine and guardrails — this is where the tool-call-parsing correctness question gets resolved.
2. Integration tests against all 3 real providers, gated behind env vars.
3. CI workflow (unit tests blocking, integration tests on main only).
4. Examples — build these right after tests pass, since they double as manual smoke tests.
5. Benchmarks — run once examples prove the SDK works end-to-end.
6. Docs site — assemble from what examples + benchmarks already produced.
7. Landing page — last, once you have real numbers to put on it.