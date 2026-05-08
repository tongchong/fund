import { User } from "src/server/db/entities/user";
import { forkEntityManager } from "src/utils/getOrm";
import { paginationProps } from "src/utils/orm";
import { paginationSchema } from "src/utils/pagination";
import { z } from "zod";

import { authProcedure } from "../../procedure/base";

export const BillListSchema = z.object({
  id: z.number(),
  identity: z.string(),
  name: z.string(),
  createTime: z.string().nullable(),
  updateTime: z.string().nullable(),
});

export const list = authProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/list",
      tags: ["user"],
      summary: "Read all bill",
    },
  })
  .input(z.object({
    ...paginationSchema.shape,
  }))
  .output(z.object({ items: z.array(BillListSchema), count: z.number() }))
  .query(async ({ input, ctx: { user: _user } }) => {

    const { pageSize, page } = input;
    const em = await forkEntityManager();


    const [items, count] = await em.findAndCount(User, {}, {
      ...paginationProps(page, pageSize),
      orderBy: { createTime: "desc" },
    });

    return { items: items.map((x) => {
      return {
        ...x,
        createTime: x.createTime ? x.createTime.toISOString() : null,
        updateTime: x.updateTime ? x.updateTime.toISOString() : null,
      }; }), count };
  });
