import { Connection, EntityManager, IDatabaseDriver } from "@mikro-orm/core";
import { Seeder } from "@mikro-orm/seeder";

export const DatabaseSeeder = () => class DatabaseSeeder extends Seeder {
  async run(_em: EntityManager<IDatabaseDriver<Connection>>): Promise<void> {
    // Initial admin user is created from the /init page.
  }
};
