import * as AWS from "aws-sdk";
AWS.config.update({ region: process.env.AWS_REGION ?? "us-east-1" });
const ddb = new AWS.DynamoDB.DocumentClient();

export async function wipeTable() {
  const res = await ddb.scan({ TableName: process.env.TABLE_NAME! }).promise();
  return await Promise.all((res.Items ?? []).map((it) => ddb.delete({
    TableName: process.env.TABLE_NAME!,
    Key: {
      pk: it.pk,
      sk: it.sk
    }
  }).promise()));
}
