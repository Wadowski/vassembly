import { Model } from "@vassembly/model";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class RefreshTokenModel extends Model {
  @Field(() => String)
  userId?: string;

  @Field(() => String)
  tokenHash?: string;

  @Field(() => String)
  description?: string;

  @Field(() => Date)
  expiresAt?: Date;

  @Field(() => Date, { nullable: true })
  revokedAt?: Date | null;

  @Field(() => String, { nullable: true })
  replacedByRefreshTokenId?: string | null;
}
