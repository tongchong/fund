import { Migration20260511131837 } from "./Migration20260511131837";
import { Migration20260511140904 } from "./Migration20260511140904";
import { Migration20260512143000 } from "./Migration20260512143000";
import { Migration20260518120000 } from "./Migration20260518120000";
import { Migration20260519103000 } from "./Migration20260519103000";
import { Migration20260519110000 } from "./Migration20260519110000";

export const migrations = [
  { name: "Migration20260511131837", class: Migration20260511131837 },
  { name: "Migration20260511140904", class: Migration20260511140904 },
  { name: "Migration20260512143000", class: Migration20260512143000 },
  { name: "Migration20260518120000", class: Migration20260518120000 },
  { name: "Migration20260519103000", class: Migration20260519103000 },
  { name: "Migration20260519110000", class: Migration20260519110000 },
];
