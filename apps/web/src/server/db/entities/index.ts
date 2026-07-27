import { fundEntitySchema } from "src/server/db/entities/fund";
import { fundArbitrageRedemptionEntitySchema } from "src/server/db/entities/fundArbitrageRedemption";
import { fundDailyEntitySchema } from "src/server/db/entities/fundDaily";
import { fundPricePinEntitySchema } from "src/server/db/entities/fundPricePin";
import { marketIndexEntitySchema } from "src/server/db/entities/marketIndex";
import { roleEntitySchema } from "src/server/db/entities/user";

export const entities = [
  roleEntitySchema,
  fundEntitySchema,
  fundArbitrageRedemptionEntitySchema,
  fundDailyEntitySchema,
  fundPricePinEntitySchema,
  marketIndexEntitySchema,
];
