import { Model } from "@vassembly/model";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class UserModel extends Model {
  @Field(() => String)
  email?: string;

  @Field(() => String)
  passwordHash?: string;

  @Field(() => String)
  firstName?: string;

  @Field(() => String)
  lastName?: string;

  @Field(() => Date, { nullable: true })
  verifiedAt?: Date | null;
}
