import { router } from "../../def";
import { init } from "./init";
import { register } from "./userLogon";

export const logon = router({
  register,
  init,
});
