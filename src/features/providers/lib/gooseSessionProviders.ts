import { CURATED_PROVIDER_CATALOG_BY_ID } from "@/features/providers/curatedProviders";

/**
 * Whether the pinned Goose sidecar can accept this id via
 * `setSessionConfigOption(configId=provider)`.
 *
 * Hermes is catalogued so Settings/Doctor can show an honest unavailable
 * state, but the current Goose pin has no `hermes-acp` provider. Do not
 * treat PATH discovery as session-ready.
 */
export function gooseCanSetProvider(providerId: string): boolean {
  if (providerId === "goose") {
    return true;
  }
  return (
    CURATED_PROVIDER_CATALOG_BY_ID.get(providerId)?.sessionLaunchSupported !==
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
