// Issue types must stay in sync with the backend service wire values.
export const ISSUE_TYPES = [
  "illegal_garbage_dumping",
  "noise_nuisance",
  "biker_gang",
  "accident",
  "illegal_barbecue",
  "bear_sighting",
] as const;

export type IssueType = (typeof ISSUE_TYPES)[number];

export interface IssueTypeDef {
  value: IssueType;
  /** English label. */
  label: string;
  /** Japanese label (Japan-first rollout). */
  labelJa: string;
  /** Accent color used by the selection tile. */
  color: string;
  /** Ionicons glyph name. */
  icon: string;
}

export const ISSUE_TYPE_DEFS: IssueTypeDef[] = [
  {
    value: "illegal_garbage_dumping",
    label: "Illegal garbage dumping",
    labelJa: "不法投棄",
    color: "#16a34a",
    icon: "trash",
  },
  {
    value: "noise_nuisance",
    label: "Loud music / noise",
    labelJa: "騒音",
    color: "#7c3aed",
    icon: "musical-notes",
  },
  {
    value: "biker_gang",
    label: "Loud biker gang",
    labelJa: "暴走族",
    color: "#dc2626",
    icon: "speedometer",
  },
  { value: "accident", label: "Accident", labelJa: "事故", color: "#ea580c", icon: "warning" },
  {
    value: "illegal_barbecue",
    label: "Illegal barbecue",
    labelJa: "無許可バーベキュー",
    color: "#d97706",
    icon: "flame",
  },
  { value: "bear_sighting", label: "Bear sighting", labelJa: "クマ目撃", color: "#92400e", icon: "paw" },
];

export function issueTypeDef(value: IssueType): IssueTypeDef {
  const def = ISSUE_TYPE_DEFS.find((d) => d.value === value);
  if (!def) throw new Error(`Unknown issue type: ${value}`);
  return def;
}
