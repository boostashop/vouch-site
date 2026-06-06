# Project Workflow & Environment Awareness

## Environment Detection
Before executing any shell commands intended for the VPS, verify the current environment:
1. Run `hostname`.
2. If the hostname is **NOT** `STELLAR-AIO` (or whatever the VPS hostname is), you are on the **Local Machine**.
3. If on the Local Machine, use SSH to execute commands on the VPS.
4. If on the VPS, execute commands directly.

## VPS Connection Details
Connection details (host, user, SSH key) are intentionally NOT committed to the
repo. Keep them in an untracked local file (e.g. `~/.ssh/config` or a private,
git-ignored notes file). Never commit private keys or host IPs.

## Execution Patterns
- **Local:** `powershell.exe -NoProfile -Command <command>`
- **Remote (from Local):** `ssh <vps-alias> "<command>"`  (configure `<vps-alias>`
  in your local `~/.ssh/config`)
- **Direct (on VPS):** `<command>`

## Task: Checking Environment
Always check `hostname` at the start of a session to set the correct execution context.
