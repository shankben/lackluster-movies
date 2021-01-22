import { Construct, RemovalPolicy } from "@aws-cdk/core";
import {
  AttributeType,
  BillingMode,
  StreamViewType,
  Table as DynamoTable
} from "@aws-cdk/aws-dynamodb";

export interface TableProps {
  tableName: string;
}

export default class Table extends Construct {
  public readonly table: DynamoTable;

  constructor(scope: Construct, id: string, props: TableProps) {
    super(scope, id);

    this.table = new DynamoTable(this, id, {
      tableName: props.tableName,
      billingMode: BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: "ttl",
      removalPolicy: RemovalPolicy.DESTROY,
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
      partitionKey: {
        name: "pk",
        type: AttributeType.STRING
      },
      sortKey: {
        name: "sk",
        type: AttributeType.STRING
      }
    });

    this.table.addGlobalSecondaryIndex({
      indexName: "sk-pk-index",
      partitionKey: {
        name: "sk",
        type: AttributeType.STRING
      },
      sortKey: {
        name: "pk",
        type: AttributeType.STRING
      }
    });

    this.table.addGlobalSecondaryIndex({
      indexName: "gk-sk-index",
      partitionKey: {
        name: "gk",
        type: AttributeType.STRING
      },
      sortKey: {
        name: "sk",
        type: AttributeType.STRING
      }
    });
  }
}
