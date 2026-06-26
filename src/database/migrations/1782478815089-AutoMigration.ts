import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutoMigration1782478815089 implements MigrationInterface {
  name = 'AutoMigration1782478815089';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "games"
      ADD COLUMN "moves" text NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "games"
      DROP COLUMN "moves"
    `);
  }
}
