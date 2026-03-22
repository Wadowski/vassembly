import { Model } from "@vassembly/model";
import { Field, ObjectType } from "type-graphql";
import { MongoDbOmit } from "@vassembly/model";

@ObjectType()
export class RefreshTokenModel extends Model {
  @Field(() => String)
  userId?: string;

  @Field(() => String)
  tokenHash?: string;

  @MongoDbOmit
  token?: string;

  @Field(() => String)
  description?: string;

  @Field(() => Date)
  expiresAt?: Date;

  @Field(() => Date, { nullable: true })
  revokedAt?: Date | null;

  @Field(() => String, { nullable: true })
  replacedByRefreshTokenId?: string | null;
}
