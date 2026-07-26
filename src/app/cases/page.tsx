import { Metadata } from "next";
import { CasesClient } from "./cases-client";

export const metadata: Metadata = {
  title: "Resolved Cases Ledger",
  description:
    "Explore the public ledger of concluded juristic analysis cases, evaluated evidence chains, and scholarly verdicts across Islamic schools of thought.",
  openGraph: {
    title: "Resolved Cases Ledger | Tarjih",
    description:
      "Explore concluded juristic analysis cases with transparent reasoning trees and evidence strength.",
  },
};

export default function CasesPage() {
  return <CasesClient />;
}
