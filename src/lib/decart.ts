import { createDecartClient, models } from "@decartai/sdk";

// Server-side client (for token generation)
export function getServerClient() {
  return createDecartClient({
    apiKey: process.env.DECART_API_KEY!,
  });
}

// Client-side client (with ephemeral token)
export function getClient(apiKey: string) {
  return createDecartClient({ apiKey });
}

export { models };
