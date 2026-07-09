export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}

/**
 * High-fidelity mock data representing the core features of the Tarjih platform.
 */
export const featuresData: FeatureItem[] = [
  {
    id: "weighing",
    title: "Opinion Weighing (Tarjih)",
    description: "Systematically weigh conflicting juristic opinions by evaluating their textual evidence strengths, authenticity, and logical arguments.",
    icon: "sparkles",
  },
  {
    id: "trees",
    title: "Reasoning Trees (Qiyas)",
    description: "Trace and visualize analogical extensions and juristic derivations through interactive, structured node diagrams and dependency flows.",
    icon: "layers",
  },
  {
    id: "multi-school",
    title: "Multi-School Integration",
    description: "Compare and contrast legal resolutions across the major Islamic schools of jurisprudence: Shafi'i, Hanafi, Maliki, and Hanbali.",
    icon: "accessibility",
  },
  {
    id: "sources",
    title: "Textual Anchoring",
    description: "Connect legal conclusions directly to verified primary source texts from the Qur'an, Sunnah, and classical consensus (Ijma).",
    icon: "route",
  },
];
