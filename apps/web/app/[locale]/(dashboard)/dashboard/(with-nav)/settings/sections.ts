import type { LucideIcon } from "lucide-react";
import {
  FileText,
  Globe,
  Info,
  MessageSquare,
  Share2,
  Sparkles,
  Wifi,
} from "lucide-react";

export type SettingsSectionId =
  | "general"
  | "appearance"
  | "languages"
  | "reviews"
  | "wifi"
  | "extra"
  | "social";

export type SettingsSection = {
  id: SettingsSectionId;
  icon: LucideIcon;
  titleKey: `sections.${SettingsSectionId}.title`;
  descriptionKey: `sections.${SettingsSectionId}.description`;
  badgeKey?: `badges.${string}`;
};

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: "general",
    icon: Info,
    titleKey: "sections.general.title",
    descriptionKey: "sections.general.description",
  },
  {
    id: "appearance",
    icon: Sparkles,
    titleKey: "sections.appearance.title",
    descriptionKey: "sections.appearance.description",
  },
  {
    id: "languages",
    icon: Globe,
    titleKey: "sections.languages.title",
    descriptionKey: "sections.languages.description",
  },
  {
    id: "reviews",
    icon: MessageSquare,
    titleKey: "sections.reviews.title",
    descriptionKey: "sections.reviews.description",
    badgeKey: "badges.soon",
  },
  {
    id: "wifi",
    icon: Wifi,
    titleKey: "sections.wifi.title",
    descriptionKey: "sections.wifi.description",
  },
  {
    id: "extra",
    icon: FileText,
    titleKey: "sections.extra.title",
    descriptionKey: "sections.extra.description",
  },
  {
    id: "social",
    icon: Share2,
    titleKey: "sections.social.title",
    descriptionKey: "sections.social.description",
  },
];


