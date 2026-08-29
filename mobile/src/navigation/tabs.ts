import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export type TabKey = "report" | "history" | "dashboard" | "donate";

export interface TabDef {
  key: TabKey;
  label: string;
  icon: IoniconName;
  iconActive: IoniconName;
}

export const TABS: TabDef[] = [
  { key: "report", label: "Report", icon: "add-circle-outline", iconActive: "add-circle" },
  { key: "history", label: "History", icon: "time-outline", iconActive: "time" },
  { key: "dashboard", label: "Dashboard", icon: "stats-chart-outline", iconActive: "stats-chart" },
  { key: "donate", label: "Donate", icon: "heart-outline", iconActive: "heart" },
];
