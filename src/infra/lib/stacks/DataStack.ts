import path from "path";

import { Construct, Stack, StackProps } from "@aws-cdk/core";
import { DynamoEventSource } from "@aws-cdk/aws-lambda-event-sources";
import {
  Code,
  Function as LambdaFunction,
  Runtime,
  StartingPosition
} from "@aws-cdk/aws-lambda";

import LambdaBaseLayer from "../constructs/LambdaBaseLayer";
import Table from "../constructs/Table";


export default class DataStack extends Stack {
  public readonly table: Table;

  private readonly assetPath = path.join(__dirname, "..", "..", "src",
    "lambda");

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.table = new Table(this, "Table", {
      tableName: "LackLusterMovies"
    });

    const baseLayer = new LambdaBaseLayer(this, "LambdaBaseLayer");

    const echoFn = new LambdaFunction(this, "Echo", {
      functionName: "LackLusterMovies-Echo",
      runtime: Runtime.NODEJS_12_X,
      handler: "index.handler",
      code: Code.fromAsset(path.join(this.assetPath, "echo")),
      layers: [baseLayer.layerVersion],
      environment: {
        TABLE_NAME: this.table.table.tableName
      }
    });

    echoFn.addEventSource(new DynamoEventSource(this.table.table, {
      startingPosition: StartingPosition.LATEST
    }));
  }
}
