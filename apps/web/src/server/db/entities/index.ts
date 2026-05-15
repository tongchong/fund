import { fundEntitySchema } from "src/server/db/entities/fund";
import { fundDailyEntitySchema } from "src/server/db/entities/fundDaily";
import { marketIndexEntitySchema } from "src/server/db/entities/marketIndex";
import { roleEntitySchema } from "src/server/db/entities/user";

export const entities = [
  roleEntitySchema,
  fundEntitySchema,
  fundDailyEntitySchema,
  marketIndexEntitySchema,
];
