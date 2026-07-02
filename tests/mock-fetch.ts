import { vi } from "vitest";

export type MockFetch = ReturnType<typeof vi.fn>;

export const makeMockFetch = (): MockFetch => vi.fn();

export const respond = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const respondText = (body: string, status = 200): Response =>
  new Response(body, { status });
