import { router } from "../../def";
import {
  createArbitrageRedemption,
  daily,
  deleteArbitrageRedemption,
  list,
  listArbitrageRedemptions,
  listPricePins,
  updateFavorite,
  updateLowValue,
  updateReviewed,
} from "./fund";

export const fund = router({
  list,
  daily,
  listPricePins,
  listArbitrageRedemptions,
  createArbitrageRedemption,
  deleteArbitrageRedemption,
  updateFavorite,
  updateReviewed,
  updateLowValue,
});
