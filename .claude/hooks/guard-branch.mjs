#!/usr/bin/env node
// PreToolUse(Bash) guard: deny `git commit` / `git push` while on the `main`
// branch, so work happens on a ticket branch (see CLAUDE.md git workflow).
import fs from "node:fs";
import { execSync } from "node:child_process";

let input = {};
try {
  input = JSON.parse(fs.readFileSync(0, "utf8") || "{}");
} catch {
  process.exit(0); // unparseable stdin — don't interfere
}

const command = input?.tool_input?.command ?? "";
const cwd = input?.cwd || process.cwd();

/** True if any shell segment runs `git commit` or `git push` (ignoring global flags). */
function isGitCommitOrPush(cmd) {
  for (const seg of cmd.split(/&&|\|\||;|\|/)) {
    const tokens = seg.trim().split(/\s+/).filter(Boolean);
    const gi = tokens.indexOf("git");
    if (gi === -1) continue;
    let i = gi + 1;
    while (i < tokens.length) {
      const t = tokens[i];
      // skip global options that take a value, then bare flags
      if (["-C", "-c", "--git-dir", "--work-tree", "--namespace"].includes(t)) {
        i += 2;
        continue;
      }
      if (t.startsWith("-")) {
        i += 1;
        continue;
      }
      break;
    }
    const sub = tokens[i];
    if (sub === "commit" || sub === "push") return true;
  }
  return false;
}

if (!isGitCommitOrPush(command)) process.exit(0);

let branch = "";
try {
  branch = execSync("git rev-parse --abbrev-ref HEAD", {
    cwd,
    stdio: ["ignore", "pipe", "ignore"],
  })
    .toString()
    .trim();
} catch {
  process.exit(0); // not a git repo / git unavailable — don't interfere
}

if (branch === "main") {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason:
          "Blocked: you're on `main`. Squiggle work must happen on a ticket branch. " +
          "Run: git checkout main && git pull && git checkout -b ticket/CLOUD-<n>-<slug>, then retry.",
      },
    }),
  );
}

process.exit(0);
