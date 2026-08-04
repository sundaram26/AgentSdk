# Contributing to Agent SDK

First off, thank you for considering contributing to Agent SDK! It's people like you that make the open source community such a great place to learn, inspire, and create.

## 1. Where do I go from here?

If you've noticed a bug or have a feature request, make sure to check our [Issues](../../issues) to see if someone else has already created one. If not, go ahead and create a new one!

## 2. Setting up the environment

Agent SDK uses `pnpm` as its package manager and operates as a monorepo.

1. Ensure you have Node.js installed (v18+ recommended).
2. Install `pnpm` globally if you haven't already:
   ```bash
   npm install -g pnpm
   ```
3. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/agent-sdk/agent-sdk.git
   cd agent-sdk
   pnpm install
   ```

## 3. Development Workflow

The SDK heavily relies on TypeScript for type safety.

- **Typecheck**: Verify that your types are correct across the monorepo:
  ```bash
  pnpm run typecheck
  ```
- **Testing**: Ensure that all unit tests pass before submitting a PR:
  ```bash
  pnpm run test
  ```
- **Benchmarks**: If you are modifying core agent behavior or guardrails, run the benchmarks to verify performance and security:
  ```bash
  pnpm --filter agent-sdk-benchmarks start
  ```

## 4. Architecture Guidelines

Before contributing major changes, please familiarize yourself with the core architecture patterns used in this project:
- **No Third-Party Agent Frameworks**: Core behavior must remain raw TypeScript and provider SDKs.
- **Ports & Adapters**: Keep LLM logic abstracted behind the `LLMPort` interface.
- **State Machine**: The runtime strictly adheres to finite states. Logic shouldn't bypass state transitions.

## 5. Pull Requests

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. Ensure the test suite passes (`pnpm test`).
4. Format your code (we use standard TypeScript formatting rules).
5. Open a Pull Request with a clear description of what the PR does and references any related issues.

Thank you for contributing!
