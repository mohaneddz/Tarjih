import { Metadata } from "next";
import { SavedClient } from "./saved-client";

export const metadata: Metadata = {
  title: "Saved Cases",
  description: "Rulings you've bookmarked on this device, kept locally without an account.",
};

export default function SavedPage() {
  return <SavedClient />;
}
