import { CURATED_PROVIDER_CATALOG_BY_ID } from "@/features/providers/curatedProviders";
import { resolveAgentProviderCatalogId } from "@/features/providers/providerCatalog";

/**
 * Whether the pinned Goose sidecar can accept this id via
 * `setSessionConfigOption(configId=provider)`.
 *
 * Resolve aliases first so `"hermes"` / `"hermes-agent"` follow the
 * catalog entry instead of fail-opening as an unknown id.
 */
export function gooseCanSetProvider(providerId: string): boolean {
  if (providerId === "goose") {
    return true;
  }
  const catalogId = resolveAgentProviderCatalogId(providerId) ?? providerId;
  return (
    CURATED_PROVIDER_CATALOG_BY_ID.get(catalogId)?.sessionLaunchSupported !==
    false
  );
}

export function gooseSetProviderUnavailableMessage(providerId: string): string {
  return `Cannot start a session on "${providerId}": the bundled Goose backend has no matching provider.`;
}

export function assertGooseCanSetProvider(providerId: string): void {
  if (!gooseCanSetProvider(providerId)) {
    throw new Error(gooseSetProviderUnavailableMessage(providerId));
  }
}
