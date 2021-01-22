import DynamoDB from "aws-sdk/clients/dynamodb";
import { Duration } from "../common";
import Meta, { ItemPrimitive, ListOptions } from "./meta";

const ddb = new DynamoDB.DocumentClient();

export interface UserKey {
  pk: string;
  sk: string;
}

export interface UserUpdate {
  city?: string;
  dateOfBirth?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  membershipExpiresAt?: Date;
  membershipId?: string;
  moviesRented?: number;
  notifications?: boolean;
  phone?: string;
  state?: string;
  status?: string;
  street?: string;
  zipcode?: string;
}

export interface User extends ItemPrimitive {
  city: string;
  dateOfBirth: string;
  email: string;
  firstName: string;
  lastName: string;
  membershipExpiresAt: Date;
  membershipId: string;
  moviesRented: number;
  notifications: boolean;
  phone: string;
  state: string;
  status: string;
  street: string;
  zipcode: string;
}

class Users {
  private static readonly ENTITY_TYPE = "User";
  private static readonly PKA = "membershipId";

  get entityType() {
    return Users.ENTITY_TYPE;
  }

  partitionKey(it: User) {
    return `${Users.ENTITY_TYPE}|${it[Users.PKA]}`;
  }

  sortKey(it: User) {
    return this.partitionKey(it);
  }

  //// Create
  async insert(spec: User) {
    if (!(Users.PKA in spec)) {
      throw new Error(`No ${Users.PKA} defined`);
    }
    if (!("membershipExpiresAt" in spec)) {
      const now = new Date();
      const later = new Date(Number(now) + 5 * Duration.Year);
      (spec as Record<string, any>).membershipExpiresAt = later.toISOString();
    }
    return await Meta.insert<User>(
      this.partitionKey(spec),
      this.sortKey(spec),
      {
        ...spec,
        gk: Users.ENTITY_TYPE,
        moviesRented: 0,
        notifications: true
      }
    );
  }

  //// Read
  async list(opts?: ListOptions) {
    return await Meta.list<User>({
      entityType: Users.ENTITY_TYPE,
      ...opts
    });
  }

  async byAttributes(spec: UserUpdate, limit?: number) {
    const params: Record<string, string | number> = { gk: Users.ENTITY_TYPE };
    if (limit) {
      params.limit = limit;
    }
    return Users.PKA in spec ?
      Meta.itemsByPartitionKey<User>(this.partitionKey(spec as User)) :
      Meta.itemsByAttributes<UserUpdate, User>(params, spec);
  }

  //// Update
  async update(key: UserKey, spec: UserUpdate) {
    return Meta.update<User>(key.pk, key.sk, spec);
  }

  async incMoviesRented(key: UserKey) {
    const params = {
      TableName: process.env.TABLE_NAME!,
      Key: { pk: key.pk, sk: key.sk },
      UpdateExpression: "SET moviesRented = moviesRented + :one",
      ExpressionAttributeValues: { ":one": 1 },
      ReturnValues: "ALL_NEW",
    };
    const res = await ddb.update(params).promise();
    return (res.Attributes ?? {}) as User;
  }

}

export default new Users();
