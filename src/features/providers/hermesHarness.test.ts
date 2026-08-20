import { beforeEach, describe, expect, it } from "vitest";
import { discoverAcpProviders } from "@/shared/api/acp";
import { isExternalAgentProvider } from "@/shared/api/acpPersonaHandoff";
import { crateCheckIdToProviderId } from "./lib/agentIdMap";
import {
  gooseCanSetProvider,
  gooseSetProviderUnavailableMessage,
} from "./lib/gooseSessionProviders";
import { HERMES_PATH_BINARIES } from "./lib/hermesDiscovery";
import { readinessFromReport } from "./hooks/useAgentProviderStatus";
import {
  getCatalogEntry,
  getAgentProviders,
  resolveAgentProviderCatalogId,
} from "./providerCatalog";
import { useProviderCatalogStore } from "./stores/providerCatalogStore";
import type { DoctorCheck, DoctorReport } from "@/shared/api/doctor";

function agentCheck(overrides: Partial<DoctorCheck> = {}): DoctorCheck {
  return {
    id: "ai-agent-hermes",
    label: "Hermes Agent",
    status: "warn",
    message:
      "Hermes is on PATH, but this Goose backend cannot start Hermes sessions (no hermes-acp provider).",
    fixUrl:
      "https://hermes-agent.nousresearch.com/docs/user-guide/features/acp",
    fixCommand: null,
    fixType: null,
    path: "/home/user/.local/bin/hermes-acp",
    bridgePath: null,
    rawOutput: null,
    authStatus: null,
    installedVersion: null,
    latestVersion: null,
    updateAvailable: null,
    installSource: null,
    selfUpdating: null,
    main: null,
    bridge: null,
    category: "agents",
    categoryLabel: "Agents",
    ...overrides,
  };
}

describe("Hermes Agent harness", () => {
  beforeEach(() => {
    useProviderCatalogStore.getState().reset();
  });

  it("is catalogued as an unavailable ACP harness, not a session-ready peer", () => {
    const entry = getCatalogEntry("hermes-acp");
    expect(entry).toMatchObject({
      id: "hermes-acp",
      displayName: "Hermes Agent",
      category: "agent",
      binaryName: "hermes-acp",
      binaryNames: HERMES_PATH_BINARIES,
      supportsInstall: false,
      supportsAuth: false,
      supportsAuthStatus: false,
      sessionLaunchSupported: false,
    });
    expect(entry?.binaryNames).toEqual(["hermes-acp", "hermes"]);
    expect(getAgentProviders().map((provider) => provider.id)).toContain(
      "hermes-acp",
    );
  });

  it("is discoverable in the harness list", async () => {
    const providers = await discoverAcpProviders();
    expect(providers).toContainEqual({
      id: "hermes-acp",
      label: "Hermes Agent",
    });
  });

  it("resolves Hermes aliases the same way as other ACP harnesses", () => {
    expect(resolveAgentProviderCatalogId("hermes-acp")).toBe("hermes-acp");
    expect(resolveAgentProviderCatalogId("hermes-agent")).toBe("hermes-acp");
    expect(resolveAgentProviderCatalogId("hermes", "Hermes Agent")).toBe(
      "hermes-acp",
    );
    expect(
      resolveAgentProviderCatalogId("custom-id", "Hermes Agent (ACP)"),
    ).toBe("hermes-acp");
  });

  it("maps the doctor check onto the catalog id", () => {
    expect(crateCheckIdToProviderId("ai-agent-hermes")).toBe("hermes-acp");
  });

  it("stays outside Goose provider policy", () => {
    expect(isExternalAgentProvider("hermes-acp")).toBe(true);
  });

  it("does not become ready from PATH alone while Goose cannot setProvider hermes-acp", () => {
    expect(gooseCanSetProvider("hermes-acp")).toBe(false);
    expect(gooseCanSetProvider("hermes")).toBe(false);
    expect(gooseCanSetProvider("hermes-agent")).toBe(false);
    expect(gooseCanSetProvider("claude-acp")).toBe(true);
    expect(gooseCanSetProvider("goose")).toBe(true);

    const installed: DoctorReport = { checks: [agentCheck()] };
    expect(readinessFromReport(installed).get("hermes-acp")).toBe(
      "unavailable",
    );

    const fallback: DoctorReport = {
      checks: [
        agentCheck({
          path: "/home/user/.local/bin/hermes",
        }),
      ],
    };
    expect(readinessFromReport(fallback).get("hermes-acp")).toBe("unavailable");

    const missing: DoctorReport = {
      checks: [
        agentCheck({
          status: "fail",
          path: null,
          message: "Hermes sessions cannot start",
        }),
      ],
    };
    expect(readinessFromReport(missing).get("hermes-acp")).toBe("unavailable");
    expect(readinessFromReport({ checks: [] }).get("hermes-acp")).toBe(
      "unavailable",
    );
    expect(gooseSetProviderUnavailableMessage("hermes-acp")).toContain(
      "hermes-acp",
    );
  });
});
