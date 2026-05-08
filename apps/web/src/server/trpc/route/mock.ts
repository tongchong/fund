import { PlatformRole, TenantRole } from "src/models/user";
import { USE_MOCK } from "src/utils/processEnv";

export async function mock<T>(actualFn: () => T, mockFn: () => T) {

  if (USE_MOCK) {
    // await new Promise((res) => setTimeout(res, ));
    return mockFn();
  } else {
    return actualFn();
  }
}

export const MOCK_USER = {
  identityId: "demo_admin",
  name: "demo_admin",
  token: "123",
  platformRoles: [PlatformRole.PLATFORM_ADMIN],
  tenant: "default",
  tenantRoles: [TenantRole.TENANT_ADMIN],
};



