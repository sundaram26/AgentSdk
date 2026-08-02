# 📊 Benchmark & Red-Team Evaluation Results

*Generated automatically on Sunday, August 2, 2026*

## 1. CRUD API Generation Performance (5 Trials)

| Framework / SDK | Average Latency (ms) | Success Rate (%) | Validation Score (/100) | State Machine Tracing |
|---|---|---|---|---|
| **Agent SDK** | **0ms** | **100%** | **100/100** | ✅ Built-in (Tracer) |
| OpenAI Agents SDK | 448ms | 100% | 100/100 | ❌ Third-party only |

---

## 2. Guardrail Red-Team Attack Evaluation (15 Adversarial Payloads)

| Security Category | Total Attack Vectors | Blocked / Redacted | Catch Rate (%) |
|---|---|---|---|
| **Prompt Injection** | 5 | 4 | **80%** |
| **Tool Boundary Policy** | 5 | 5 | **100%** |
| **PII Data Leakage** | 5 | 5 | **100%** |
| **OVERALL TOTAL** | **15** | **14** | **93%** |
