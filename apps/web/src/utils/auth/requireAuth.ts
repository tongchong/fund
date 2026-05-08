import { AccountAffiliation, PlatformRole, TenantRole, UserInfo } from "src/models/user";

export interface User {
  tenant: string;
  identityId: string;
  name?: string;
  token: string;
  tenantRoles: TenantRole[];
  platformRoles: PlatformRole[];
  accountAffiliations: AccountAffiliation[];
  email?: string;
  createTime?: string
}


type UserType = {
  loggedIn: boolean;
  user: User | undefined;
  logout: () => void;
} | undefined;

export interface RequireAuthProps {
  userStore: UserType & { user: User },
}

export type Check = (info: UserInfo) => boolean;

// export const requireAuth = (
//   check: Check,
//   extraCheck?: (user: User) => JSX.Element | undefined,
// ) =>
//   <CP extends {}>(
//     Component: React.ComponentType<RequireAuthProps & CP>,
//   ) => (cp) => {
//     // const userStore = useStore(UserStore);
//     const userInfo = await getUserInfo()

//     if (!userStore.user) {
//       return <Redirect url="/api/auth" />;
//     }

//     if (!check(userStore.user)) {
//       return <ForbiddenPage />;
//     }

//     if (extraCheck) {
//       const node = extraCheck(userStore.user!);
//       if (node) {
//         return node;
//       }
//     }

//     return <Component userStore={userStore} {...cp} />;
//   };
