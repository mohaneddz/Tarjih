import { Metadata } from "next";
import { ProfileClient } from "./profile-client";

export const metadata: Metadata = {
  title: "Scholar Profile",
  description:
    "View jurist profile credentials, verified areas of jurisprudential expertise, research activity history, and resolved case metrics on Tarjih.",
  openGraph: {
    title: "Scholar Profile | Tarjih",
    description: "Scholar profile, juristic activity timeline, and legal expertise metrics.",
  },
};

export default function ProfilePage() {
  return <ProfileClient />;
}
