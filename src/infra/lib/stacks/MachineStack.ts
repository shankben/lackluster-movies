import path from "path";
import { Construct, Duration, Stack, StackProps } from "@aws-cdk/core";
import { Code, Runtime, Function as LambdaFunction } from "@aws-cdk/aws-lambda";
import { RetentionDays } from "@aws-cdk/aws-logs";
import LambdaBaseLayer from "../constructs/LambdaBaseLayer";
import Table from "../constructs/Table";

export interface MachineStackProps extends StackProps {
  table: Table;
}

export default class MachineStack extends Stack {
  private readonly timeoutMinutes = 5;

  private readonly assetPath = path
    .join(__dirname, "..", "..", "src", "lambda");

  constructor(scope: Construct, id: string, props: MachineStackProps) {
    super(scope, id, props);

    const { table } = props;

    const lambdaBaseLayer = new LambdaBaseLayer(this, "LambdaBaseLayer");

    const lambdaProps = {
      handler: "index.handler",
      layers: [lambdaBaseLayer.layerVersion],
      logRetention: RetentionDays.ONE_DAY,
      memorySize: 256,
      runtime: Runtime.NODEJS_12_X,
      timeout: Duration.minutes(this.timeoutMinutes),
      environment: {
        TABLE_NAME: table.table.tableName
      }
    };

    const fn = new LambdaFunction(this, "LackLusterMoviesHelloWorld", {
      ...lambdaProps,
      code: Code.fromAsset(path.join(this.assetPath, "hello")),
      functionName: "LackLusterMoviesHelloWorld"
    });

    table.table.grantReadWriteData(fn);
  }
}
