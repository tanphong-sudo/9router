# Codex / DeepSeek compatibility fork

Upstream: <https://github.com/decolua/9router>

Fork: <https://github.com/tanphong-sudo/9router>

## Compatibility changes

OpenCode Go's Responses transport must retain nested `reasoning` rather than
Chat Completions' `thinking` / `reasoning_effort` fields. Upstream v0.5.109
already includes the transport-specific reasoning fix.

This fork additionally preserves assignments created by Codex `create_thread`.
Codex seeds these sessions with a `function_call_output` containing
`<codex_delegation>`, without the corresponding call in the new session.
OpenCode Go rejects that input with HTTP 503. On the Responses transport, the
executor converts that specific unpaired seed to a user message, preserving
the complete assignment. Matched tool results, results linked through
`previous_response_id`, other tool outputs, and other transports are preserved.

Regression tests: `tests/unit/opencode-go-codex-delegation.test.js`.

## Updating this fork

Keep custom changes on `master`, with `origin` pointing to this fork and
`upstream` pointing to decolua/9router. Do not reset `master` to upstream or
force-push it: that would discard compatibility commits.

1. Start with a clean working tree and create a local backup branch.
2. Fetch `upstream` and merge `upstream/master` into `master`.
3. Resolve conflicts while retaining the tested behavior described above.
   If upstream implements the same behavior, retain the regression tests and
   verify its implementation before removing the fork's code.
4. Install dependencies and run the targeted offline suite from the repo root:

   ```sh
   pnpm install --ignore-scripts
   pnpm --dir tests install --ignore-scripts
   tests/node_modules/.bin/vitest run --config tests/vitest.config.js \
     tests/unit/opencode-go-codex-delegation.test.js \
     tests/unit/opencode-go-session.test.js \
     tests/unit/opencode-go-transport-routing.test.js \
     tests/unit/opencode-go-muse-spark-responses.test.js \
     tests/translator/thinking-unified.test.js
   ```

5. Review `git diff`, inspect dependency audit results, and push to the fork
   when the user has authorized that update.
6. Updating this Git checkout does **not** update an installed npm copy of
   9router. Build and validate a candidate before replacing a running install;
   keep an install backup and preserve the user's config, credentials, and DB.
   After activation, verify both a new DeepSeek session and a Codex delegation.

Do not run an unqualified `npm update -g 9router` expecting it to preserve fork
changes: the public package is built from upstream, not this fork.

Updates are performed on request; this fork does not schedule or install them
automatically.
