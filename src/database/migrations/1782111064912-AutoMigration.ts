import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutoMigration1782111064912 implements MigrationInterface {
  name = 'AutoMigration1782111064912';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "games" DROP CONSTRAINT "UQ_19a03c1555c6508c38bc1c6b590"`,
    );
    await queryRunner.query(`ALTER TABLE "games" DROP COLUMN "room_code"`);
    await queryRunner.query(
      `ALTER TABLE "games" ADD "room_code" character varying(500) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "games" ADD CONSTRAINT "UQ_19a03c1555c6508c38bc1c6b590" UNIQUE ("room_code")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "games" DROP CONSTRAINT "UQ_19a03c1555c6508c38bc1c6b590"`,
    );
    await queryRunner.query(`ALTER TABLE "games" DROP COLUMN "room_code"`);
    await queryRunner.query(
      `ALTER TABLE "games" ADD "room_code" character varying(10) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "games" ADD CONSTRAINT "UQ_19a03c1555c6508c38bc1c6b590" UNIQUE ("room_code")`,
    );
  }
}
