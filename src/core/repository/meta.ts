import DynamoDB from "aws-sdk/clients/dynamodb";
import { expressionAttributes, putOp, updateExpression } from "../utils";
import type {
  Key,
  Model,
  ModelUpdate,
  QueryInput
} from "../common";

const ddb = new DynamoDB.DocumentClient();

export interface ItemPrimitive {
  pk: string;
  sk: string;
  gk: string;
}

export interface ListOptions {
  entityType?: string;
  limit?: number;
  fields?: string[];
  lastEvaluatedKey?: Record<string, any>
}

export interface ItemsByPartitionKeyOptions {
  sk?: string;
  gk?: string;
  limit?: number;
}

export interface ItemsByAttributesOptions {
  gk?: string;
  limit?: number;
}

class Meta {
  private static readonly ENTITY_TYPE = "Meta";

  private static insertMetaOp = {
    TableName: process.env.TABLE_NAME!,
    Item: {
      pk: Meta.ENTITY_TYPE,
      sk: Meta.ENTITY_TYPE,
      gk: Meta.ENTITY_TYPE
    }
  };

  constructor() {
    (async () => {
      const params = {
        TableName: process.env.TABLE_NAME!,
        ExpressionAttributeNames: {"#pk": "pk"},
        ExpressionAttributeValues: {":pk": Meta.ENTITY_TYPE},
        KeyConditionExpression: "#pk = :pk",
        Limit: 1
      };
      const res = await ddb.query(params).promise();
      if (res.Count === 0) {
        await ddb.put(Meta.insertMetaOp).promise();
      }
    })();
  }

  //// Create
  async insert<T extends Model>(pk: string, sk: string, spec: T): Promise<T> {
    const item: Record<string, any> = {
      ...spec,
      pk,
      sk
    };
    if (!("createdAt" in item)) {
      item.createdAt = new Date().toISOString();
    }
    try {
      await ddb.put(putOp(item).Put).promise();
      return (await this.itemsByPartitionKey<T>(item.pk))[0];
    } catch (err) {
      console.log(err);
      return {} as T;
    }
  }

  //// Read
  async list<T extends Model>(opts: ListOptions): Promise<T[]> {
    if (!("entityType" in opts)) {
      throw new Error("Specify entity type to list");
    }
    const params: QueryInput = {
      TableName: process.env.TABLE_NAME!,
      IndexName: "gk-sk-index",
      ExpressionAttributeValues: {":gk": opts.entityType},
      KeyConditionExpression: "gk = :gk"
    };
    if ("lastEvaluatedKey" in opts) {
      params.ExclusiveStartKey = opts.lastEvaluatedKey;
    }
    if ("limit" in opts) {
      params.Limit = opts.limit;
    }
    if ("fields" in opts) {
      if (!params.ExpressionAttributeNames) {
        params.ExpressionAttributeNames = {};
      }
      opts.fields!.forEach((it) => {
        params.ExpressionAttributeNames![`#${it}`] = it;
      });
      params.ProjectionExpression = opts.fields!
        .map((it) => `#${it}`).join(",");
    }
    const res = await ddb.query(params).promise();
    return (res.Items ?? []) as T[];
  }

  async itemsByPartitionKeys<T extends Model>(
    opts: ItemsByPartitionKeyOptions = {},
    ...pks: string[]
  ): Promise<T[]> {
    return (await Promise.all(pks
      .map((pk) => this.itemsByPartitionKey<T>(pk, opts))))
      .reduce((x, y) => x.concat(y), []);
  }

  async itemsByPartitionKey<T extends Model>(
    pk: string,
    opts: ItemsByPartitionKeyOptions = {}
  ): Promise<T[]> {
    if ("gk" in opts && "sk" in opts) {
      throw new Error("Cannot specify both gk and sk");
    }
    const params: QueryInput = {
      TableName: process.env.TABLE_NAME!,
      ExpressionAttributeValues: { ":pk": pk },
      KeyConditionExpression: "pk = :pk",
    };
    if ("limit" in opts) {
      params.Limit = opts.limit;
    }
    if ("sk" in opts) {
      params.ExpressionAttributeValues![":sk"] = opts.sk;
      params.KeyConditionExpression += " AND begins_with(sk, :sk)";
    } else if ("gk" in opts) {
      params.IndexName = "gk-sk-index";
      params.ExpressionAttributeValues![":gk"] = opts.gk;
      params.KeyConditionExpression += " AND gk = :gk";
    }
    const res = await ddb.query(params).promise();
    return (res.Items ?? []) as T[];
  }

  async itemsByAttributes<S extends ModelUpdate, T extends Model>(
    opts: ItemsByAttributesOptions,
    spec: S
  ) {
    const {
      ExpressionAttributeNames: ean,
      ExpressionAttributeValues: eav
    } = expressionAttributes(spec);
    const eavk = Object.keys(eav);
    const params: QueryInput = {
      TableName: process.env.TABLE_NAME!,
      IndexName: "gk-sk-index",
      KeyConditionExpression: "gk = :gk",
      ExpressionAttributeNames: ean,
      ExpressionAttributeValues: {
        ...eav,
        ":gk": opts.gk
      },
      FilterExpression: Object.keys(ean)
        .map((k, i) => `begins_with(${k}, ${eavk[i]})`).join(" AND ")
    };
    if ("limit" in opts) {
      params.Limit = opts.limit;
    }
    const res = await ddb.query(params).promise();
    return (res.Items ?? []) as T[];
  }

  //// Update
  async update<T extends Model>(pk: string, sk: string, spec: ModelUpdate) {
    const params = {
      ...updateExpression(spec),
      ReturnValues: "ALL_NEW",
      Key: { pk, sk }
    };
    const res = await ddb.update(params).promise();
    return (res.Attributes ?? {}) as T;
  }
}

export default new Meta();
