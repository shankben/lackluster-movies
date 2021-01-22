import path from "path";
import DynamoDB from "aws-sdk/clients/dynamodb";
import SES from "aws-sdk/clients/sesv2";
import { DynamoDBStreamEvent } from "aws-lambda";

const corePath = process.env.AWS_EXECUTION_ENV ?
  "lackluster-movies-core" :
  path.join("..", "..", "..", "..", "core");

const ses = new SES();

const sendEmail = async (subject: string, body: string) => ses.sendEmail({
  Destination: { ToAddresses: [ process.env.TO_EMAIL_ADDRESS! ] },
  FromEmailAddress: process.env.FROM_EMAIL_ADDRESS!,
  Content: {
    Simple: {
      Subject: {
        Data: subject,
        Charset: "UTF-8"
      },
      Body: {
        Text: {
          Data: body,
          Charset: "UTF-8"
        }
      }
    }
  }
}).promise();

export const handler = async (event: DynamoDBStreamEvent) => {
  const core = await import(corePath);
  const { repository, rentals } = core;
  const { Rentals } = rentals;

  const rentalExpirations = (event.Records ?? [])
    .filter((it) => it.eventName === "REMOVE")
    .map((it) => it.dynamodb)
    .filter((it) => /\|Expires/.test(it?.Keys?.sk as string))
    .map((it) => DynamoDB.Converter.unmarshall(it!.Keys!))
    .map((it) => ({
      pk: it.pk,
      sk: Rentals.userIdFromSortKey(it.sk)
    }));

  await sendEmail(`Testing ${Math.random()}`, `Testing ${Math.random()}`);

  for (const { pk, sk } of rentalExpirations) {
    await repository.updateRental(
      { moviePartitionKey: pk, userPartitionKey: sk },
      { status: "Late" }
    );
  }
};




async function main() {
  const ev = {
    "Records": [
      {
        "eventID": "7c9f11ac3c10dd6b794e0731330d5b02",
        "eventName": "REMOVE",
        "eventVersion": "1.1",
        "eventSource": "aws:dynamodb",
        "awsRegion": "us-east-1",
        "dynamodb": {
          "ApproximateCreationDateTime": 1611167041,
          "Keys": {
            "sk": {
              "S": "User|49V0qwrX|1611167040804|Expires|Day"
            },
            "pk": {
              "S": "Movie|tt0489479"
            }
          },
          "OldImage": {
            "gk": {
              "S": "Rental"
            },
            "sk": {
              "S": "User|49V0qwrX|1611167040804|Expires|Day"
            },
            "pk": {
              "S": "Movie|tt0489479"
            },
            "ttl": {
              "N": "1611081240"
            }
          },
          "SequenceNumber": "30980000000000002244923831",
          "SizeBytes": 133,
          "StreamViewType": "NEW_AND_OLD_IMAGES"
        },
        "userIdentity": {
          "principalId": "dynamodb.amazonaws.com",
          "type": "Service"
        },
        "eventSourceARN": "arn:aws:dynamodb:us-east-1:061635907654:table/LackLusterMovies/stream/2021-01-19T18:48:08.779"
      },
      {
        "eventID": "1f52f699d37ef70538c798d9ef05f872",
        "eventName": "REMOVE",
        "eventVersion": "1.1",
        "eventSource": "aws:dynamodb",
        "awsRegion": "us-east-1",
        "dynamodb": {
          "ApproximateCreationDateTime": 1611167041,
          "Keys": {
            "sk": {
              "S": "User|49V0qwrX|1611167040804|Expires|Week"
            },
            "pk": {
              "S": "Movie|tt0489479"
            }
          },
          "OldImage": {
            "gk": {
              "S": "Rental"
            },
            "sk": {
              "S": "User|49V0qwrX|1611167040804|Expires|Week"
            },
            "pk": {
              "S": "Movie|tt0489479"
            },
            "ttl": {
              "N": "1610562840"
            }
          },
          "SequenceNumber": "30980100000000002244923832",
          "SizeBytes": 135,
          "StreamViewType": "NEW_AND_OLD_IMAGES"
        },
        "userIdentity": {
          "principalId": "dynamodb.amazonaws.com",
          "type": "Service"
        },
        "eventSourceARN": "arn:aws:dynamodb:us-east-1:061635907654:table/LackLusterMovies/stream/2021-01-19T18:48:08.779"
      }
    ]
  };

  //@ts-ignore
  await handler(ev);
}

main().catch(console.error);
