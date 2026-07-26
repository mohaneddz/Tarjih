import { Metadata } from "next";
import { SettingsClient } from "./settings-client";

export const metadata: Metadata = {
  title: "Juristic Configurations & Settings",
  description:
    "Configure legal school methodologies, juristic derivation weights, and engine strictness parameters in Tarjih.",
  openGraph: {
    title: "Juristic Configurations | Tarjih",
    description: "Adjust legal school defaults, derivation weights, and strictness parameters.",
  },
};

export default function SettingsPage() {
  return <SettingsClient />;
}
