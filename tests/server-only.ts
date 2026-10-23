import { vi } from "vitest";
// Vitest runs in Node, outside Next.js's react-server module conditions.
vi.mock("server-only", () => ({}));
