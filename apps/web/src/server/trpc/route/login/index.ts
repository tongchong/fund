import { router } from "../../def";
import { envRouter } from "./getenv";
import { authRouter } from "./userLogin";

export const login = router({
  authRouter,
  envRouter,
});
