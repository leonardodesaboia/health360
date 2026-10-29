/** Extracts supplied wording only; never generates or evaluates clinical criteria. */
export function ruleCopy(rationale: string) {
  const summary = rationale.split(/(?<=[.!?])\s+/)[0].trim();
  const match = / because | within |; /.exec(summary);
  if (!match) return { proposed: summary, why: summary, summary };
  return {
    proposed: summary.slice(0, match.index).trim(),
    why:
      (match[0] === " within " ? "within " : "") +
      summary.slice(match.index + match[0].length).trim(),
    summary,
  };
}
