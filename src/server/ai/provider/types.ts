import "server-only";

export type FailureReason =
  | "configuration"
  | "invalid_input"
  | "timeout"
  | "api_error"
  | "refused"
  | "invalid_output"
  | "unsupported_evidence"
  | "unsupported_scope";
export type ProviderResult =
  | { ok: true; data: unknown }
  | {
      ok: false;
      reason: "timeout" | "api_error" | "refused" | "invalid_output";
    };
export interface ProviderRequest {
  system: string;
  input: string;
  signal: AbortSignal;
}
export interface LlmProvider {
  readonly id: string;
  readonly model: string;
  generate(request: ProviderRequest): Promise<ProviderResult>;
}
