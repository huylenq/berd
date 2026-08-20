/**
 * PATH launchers Berd and Doctor share for Hermes, preferred first.
 * Keep in sync with `HERMES_AGENT_CHECK.binary_names` in
 * `src-tauri/src/commands/doctor.rs`.
 */
export const HERMES_PATH_BINARIES = ["hermes-acp", "hermes"] as const;

export const HERMES_HARNESS_ID = "hermes-acp";
