import { updateUserPassword } from "src/server/trpc/route/user/updateUserPassword";

import { router } from "../../def";
import { deleteUser } from "./deleteUser";
import { checkAdminExists } from "./hasAdmin";
import { logoutRouter } from "./logout";
import { list } from "./user";
import { verifyToken } from "./verify";

export const user = router({
  list,
  deleteUser,
  verifyToken,
  logoutRouter,
  checkAdminExists,
  updateUserPassword,
});
