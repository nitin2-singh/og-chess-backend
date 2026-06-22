import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutoMigration1782111146485 implements MigrationInterface {
  name = 'AutoMigration1782111146485';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "games" DROP CONSTRAINT "FK_c124351386bb4d7f5db3f37c372"`,
    );
    await queryRunner.query(
      `ALTER TABLE "games" ALTER COLUMN "white_player_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "games" ADD CONSTRAINT "FK_c124351386bb4d7f5db3f37c372" FOREIGN KEY ("white_player_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "games" DROP CONSTRAINT "FK_c124351386bb4d7f5db3f37c372"`,
    );
    await queryRunner.query(
      `ALTER TABLE "games" ALTER COLUMN "white_player_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "games" ADD CONSTRAINT "FK_c124351386bb4d7f5db3f37c372" FOREIGN KEY ("white_player_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
