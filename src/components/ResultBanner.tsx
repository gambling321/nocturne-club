import { CheckCircle2, Info, XCircle } from "lucide-react";

export type ResultKind = "win" | "loss" | "neutral";

export function ResultBanner({ kind = "neutral", children }: { kind?: ResultKind; children: React.ReactNode }) {
  const Icon = kind === "win" ? CheckCircle2 : kind === "loss" ? XCircle : Info;
  return <div className={`result-banner ${kind}`} role="status"><Icon size={18} /> <span>{children}</span></div>;
}
