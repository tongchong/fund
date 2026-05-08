import { EntitySchema } from "@mikro-orm/core";
import { CURRENT_TIMESTAMP, DATETIME_TYPE } from "src/utils/orm";


export enum Role {
  USER = "USER",
  LIBRARY_ADMIN = "LIBRARY_ADMIN",
  ADMIN = "ADMIN",
}

export class User {
  id!: number;
  name: string;
  identity: string;
  role: Role;
  phone?: string;
  email?: string;
  password!: string;
  delete: boolean; // ✅ 保持 boolean，但会映射到 TINYINT
  createTime?: Date;
  updateTime?: Date;
  title?: string;
  remark?: string;
  enabled: boolean; // ✅ 保持 boolean，但会映射到 TINYINT

  constructor(init: {
    name: string;
    identity: string;
    role: Role;
    phone?: string;
    email?: string;
    password: string;
    delete?: boolean;
    createTime?: Date;
    updateTime?: Date;
    title?: string;
    remark?: string;
    enabled: boolean;
  }) {
    this.name = init.name;
    this.identity = init.identity;
    this.role = init.role;
    this.phone = init.phone;
    this.email = init.email;
    this.password = init.password;
    this.delete = init.delete ?? false; // ✅ 改为 ?? 而不是 ||
    this.title = init.title;
    this.remark = init.remark;
    this.enabled = init.enabled ?? true; // ✅ 改为 ?? 而不是 ||

    if (init.createTime) {
      this.createTime = init.createTime;
    }
    if (init.updateTime) {
      this.updateTime = init.updateTime;
    }
  }
}

export const roleEntitySchema = new EntitySchema({
  class: User,
  tableName: "user",
  name: "user",
});

roleEntitySchema.addPrimaryKey("id", Number);
roleEntitySchema.addProperty("name", String);
roleEntitySchema.addProperty("identity", String);
roleEntitySchema.addEnum("role", String, { items: () => Role });
roleEntitySchema.addProperty("phone", String, { nullable: true });
roleEntitySchema.addProperty("email", String, { nullable: true });
roleEntitySchema.addProperty("password", String);
// columnType 改为 TINYINT，这样会自动处理 boolean <-> 0/1 的转换
roleEntitySchema.addProperty("delete", Boolean, {
  default: false,
  columnType: "tinyint", // ✅ 改为 tinyint
});
roleEntitySchema.addProperty("title", String, { nullable: true });
roleEntitySchema.addProperty("remark", String, { nullable: true });
// columnType 改为 TINYINT
roleEntitySchema.addProperty("enabled", Boolean, {
  default: true,
  columnType: "tinyint", //  改为 tinyint
});
roleEntitySchema.addProperty("createTime", Date, { columnType: DATETIME_TYPE, defaultRaw: CURRENT_TIMESTAMP });
roleEntitySchema.addProperty("updateTime", Date, {
  columnType: DATETIME_TYPE, defaultRaw: CURRENT_TIMESTAMP, onUpdate: () => new Date(),
});
