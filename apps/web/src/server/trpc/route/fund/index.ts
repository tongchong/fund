import { router } from "../../def";
import { daily, list, updateFavorite, updateReviewed } from "./fund";

export const fund = router({
  list,
  daily,
  updateFavorite,
  updateReviewed,
});
