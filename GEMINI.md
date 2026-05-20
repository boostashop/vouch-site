# Project Workflow & Environment Awareness

## Environment Detection
Before executing any shell commands intended for the VPS, verify the current environment:
1. Run `hostname`.
2. If the hostname is **NOT** `STELLAR-AIO` (or whatever the VPS hostname is), you are on the **Local Machine**.
3. If on the Local Machine, use SSH to execute commands on the VPS.
4. If on the VPS, execute commands directly.

## VPS Connection Details
- **Host (IP):** 145.241.222.48
- **Username:** ubuntu
- **SSH Key Path:** `./vps.key` (Make sure to set permissions on Linux/Mac: `chmod 400 vps.key`)

## Execution Patterns
- **Local:** `powershell.exe -NoProfile -Command <command>`
- **Remote (from Local):** `ssh -i ./vps.key ubuntu@145.241.222.48 "<command>"`
- **Direct (on VPS):** `<command>`

## Task: Checking Environment
Always check `hostname` at the start of a session to set the correct execution context.
