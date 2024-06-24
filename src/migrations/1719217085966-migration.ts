import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1719217085966 implements MigrationInterface {
  name = 'Migration1719217085966';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "search_event" ("timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "userId" integer NOT NULL, "assetId" integer NOT NULL, CONSTRAINT "PK_fe0ae748ed9d0e71e1ec3534f91" PRIMARY KEY ("timestamp"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aa1841f5c09cd55473a4a698b6" ON "search_event" ("timestamp", "assetId", "userId") `,
    );

    // Convert the table to a hypertable
    await queryRunner.query(`
            SELECT create_hypertable('search_event', 'timestamp');
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_aa1841f5c09cd55473a4a698b6"`,
    );
    await queryRunner.query(`DROP TABLE "search_event"`);
  }
}
