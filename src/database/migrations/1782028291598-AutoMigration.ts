import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutoMigration1782028291598 implements MigrationInterface {
  name = 'AutoMigration1782028291598';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "first_name" character varying(50) NOT NULL, "last_name" character varying(50) NOT NULL, "access_token" character varying NOT NULL, "refresh_token" character varying NOT NULL, "username" character varying(30) NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "created_at" bigint NOT NULL DEFAULT '0', "updated_at" bigint NOT NULL DEFAULT '0', CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."games_status_enum" AS ENUM('WAITING', 'PLAYING', 'FINISHED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."games_result_enum" AS ENUM('WHITE', 'BLACK', 'DRAW')`,
    );
    await queryRunner.query(
      `CREATE TABLE "games" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "room_code" character varying(10) NOT NULL, "status" "public"."games_status_enum" NOT NULL DEFAULT 'WAITING', "result" "public"."games_result_enum", "started_at" bigint NOT NULL DEFAULT '0', "ended_at" bigint NOT NULL DEFAULT '0', "created_at" bigint NOT NULL DEFAULT '0', "updated_at" bigint NOT NULL DEFAULT '0', "white_player_id" uuid NOT NULL, "black_player_id" uuid, "created_by" uuid, "winner_id" uuid, CONSTRAINT "UQ_19a03c1555c6508c38bc1c6b590" UNIQUE ("room_code"), CONSTRAINT "PK_c9b16b62917b5595af982d66337" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "games" ADD CONSTRAINT "FK_c124351386bb4d7f5db3f37c372" FOREIGN KEY ("white_player_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "games" ADD CONSTRAINT "FK_d94bb349f694c55b301b78dca35" FOREIGN KEY ("black_player_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "games" ADD CONSTRAINT "FK_1a9ce5f2b43dfd0c1db044abfb2" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "games" ADD CONSTRAINT "FK_a74da16a8f3a10683225f15c066" FOREIGN KEY ("winner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "games" DROP CONSTRAINT "FK_a74da16a8f3a10683225f15c066"`,
    );
    await queryRunner.query(
      `ALTER TABLE "games" DROP CONSTRAINT "FK_1a9ce5f2b43dfd0c1db044abfb2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "games" DROP CONSTRAINT "FK_d94bb349f694c55b301b78dca35"`,
    );
    await queryRunner.query(
      `ALTER TABLE "games" DROP CONSTRAINT "FK_c124351386bb4d7f5db3f37c372"`,
    );
    await queryRunner.query(`DROP TABLE "games"`);
    await queryRunner.query(`DROP TYPE "public"."games_result_enum"`);
    await queryRunner.query(`DROP TYPE "public"."games_status_enum"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
