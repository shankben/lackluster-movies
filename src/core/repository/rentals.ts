import DynamoDB from "aws-sdk/clients/dynamodb";
import { ItemList, Duration, durationToString } from "../common";
import { putOp } from "../utils";
import Meta, { ItemPrimitive, ListOptions } from "./meta";
import Users, { User } from "./users";
import Movies, { Movie } from "./movies";

const ddb = new DynamoDB.DocumentClient();

//// Rental is Movie -> User association

export type RentalStatus = "Current" | "DueWithinWeek" | "Late";

export interface RentalKey {
  moviePartitionKey: string;
  userPartitionKey: string;
}

export interface RentalUpdate {
  dueAt?: Date;
  monthlyRate?: number;
  rentedAt?: Date;
  returnedAt?: Date;
  status?: RentalStatus;
}

export interface Rental extends ItemPrimitive {
  dueAt: Date;
  monthlyRate: number;
  moviePartitionKey: string;
  rentedAt: Date;
  returnedAt?: Date;
  status: RentalStatus;
  userPartitionKey: string;
  user: User;
  movie: Movie;
}

export interface RentalSearch {
  dueAt?: Date;
  monthlyRate?: number;
  movieImdbId?: string;
  moviePartitionKey?: string;
  rentedAt?: Date;
  returnedAt?: Date;
  status?: RentalStatus;
  userMembershipId?: string;
  userPartitionKey?: string;
}

class Rentals {
  private static readonly ENTITY_TYPE = "Rental";

  get entityType() {
    return Rentals.ENTITY_TYPE;
  }

  userIdFromSortKey(sk: string) {
    return sk.split("|").slice(0, 2).join("|");
  }

  private async assemble(rentalItems: ItemList): Promise<Rental[]> {
    const users = await Meta.itemsByPartitionKeys(
      { sk: Users.entityType },
      ...new Set(rentalItems
        .filter((it) => it.sk.startsWith(Users.entityType))
        .map((it) => this.userIdFromSortKey(it.sk)))
    );

    const movies = await Meta.itemsByPartitionKeys(
      { sk: Movies.entityType },
      ...new Set(rentalItems
        .filter((it) => it.pk.startsWith(Movies.entityType))
        .map((it) => it.pk))
    );

    const usersById = new Map(users.map((it) => [it.pk, it]));
    const moviesById = new Map(movies.map((it) => [it.pk, it]));

    return rentalItems
      .filter((it) => !/\|Expires/.test(it.sk))
      .map((it) => {
        it.user = usersById.get(this.userIdFromSortKey(it.sk));
        it.movie = moviesById.get(it.pk);
        return it;
      }) as Rental[];
  }

  private async byImdbId(imdbId: string) {
    const params = {
      TableName: process.env.TABLE_NAME!,
      ExpressionAttributeValues: {
        ":pk": `${Movies.entityType}|${imdbId}`,
        ":gk": Rentals.ENTITY_TYPE
      },
      KeyConditionExpression: "pk = :pk",
      FilterExpression: "gk = :gk"
    };
    const res = await ddb.query(params).promise();
    return this.assemble(res.Items ?? []);
  }

  private async byUserMembershipId(userMembershipId: string) {
    const params = {
      TableName: process.env.TABLE_NAME!,
      IndexName: "gk-sk-index",
      ExpressionAttributeValues: {
        ":gk": Rentals.ENTITY_TYPE,
        ":sk": `${Users.entityType}|${userMembershipId}`
      },
      KeyConditionExpression: "gk = :gk AND sk = :sk"
    };
    const res = await ddb.query(params).promise();
    return this.assemble(res.Items ?? []);
  }

  //// Create
  async insert(key: RentalKey, spec: RentalUpdate) {
    const now = new Date();

    if (!("dueAt" in spec)) {
      throw new Error("Must specify due date when creating rental");
    }

    const item: Record<string, any> = {
      ...spec,
      pk: key.moviePartitionKey,
      sk: key.userPartitionKey,
      gk: Rentals.ENTITY_TYPE
    };

    if (!("createdAt" in item)) {
      item.createdAt = now.toISOString();
    }

    item.dueAt = item.dueAt.toISOString();
    item.rentedAt = item.rentedAt?.toISOString();
    item.returnedAt = item.returnedAt?.toISOString();

    const params = {
      TransactItems: [
        putOp(item),
        ...[0, Duration.Day, Duration.Week].map((it) => {
          const sk = `${key.userPartitionKey}|${Number(now)}|Expires`;
          return putOp({
            pk: key.moviePartitionKey,
            sk: sk + (it === 0 ? "" : `|${durationToString(it)}`),
            gk: Rentals.ENTITY_TYPE,
            ttl: Math.ceil((Number(spec.dueAt) - it) / 1000)
          });
        })
      ]
    };

    try {
      await ddb.transactWrite(params).promise();
      return item as Rental;
    } catch (err) {
      console.log(err);
      console.dir(params, { depth: null });
      return {} as Rental;
    }
  }

  //// Read
  async list(opts?: ListOptions) {
    return this.assemble(await Meta.list<Rental>({
      entityType: Rentals.ENTITY_TYPE,
      ...opts
    }));
  }

  async byAttributes(spec: RentalSearch, limit?: number) {
    type LocalItems = Promise<Rental[]> | Rental[] | undefined;
    const items: LocalItems = "movieImdbId" in spec ?
      this.byImdbId(spec.movieImdbId!) :
      "userMembershipId" in spec ?
      this.byUserMembershipId(spec.userMembershipId!) :
      undefined;
    if (items) return items;
    const params: Record<string, string | number> = { gk: Rentals.ENTITY_TYPE };
    if (limit) {
      params.limit = limit;
    }
    return this.assemble(await Meta.itemsByAttributes<RentalSearch, Rental>(
      params,
      spec
    ));
  }

  //// Update
  async update(key: RentalKey, spec: RentalUpdate) {
    return Meta.update<Rental>(
      key.moviePartitionKey,
      key.userPartitionKey,
      spec
    );
  }
}

export default new Rentals();
