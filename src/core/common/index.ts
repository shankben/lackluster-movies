import DynamoDB from "aws-sdk/clients/dynamodb";
import type { User, UserUpdate } from "../repository/users";
import type { Movie, MovieUpdate } from "../repository/movies";
import type { Rental, RentalUpdate } from "../repository/rentals";

export type Model = User | Movie | Rental;
export type ModelUpdate = UserUpdate | MovieUpdate | RentalUpdate;
export type Key = DynamoDB.DocumentClient.Key;
export type ItemList = DynamoDB.DocumentClient.ItemList;
export type QueryInput = DynamoDB.DocumentClient.QueryInput;
export type QueryOutput = DynamoDB.DocumentClient.QueryOutput;

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 4 * WEEK;

export enum Duration {
  Hour = 3600 * 1000,
  Day = 24 * HOUR,
  Week = 7 * DAY,
  Month = 4 * WEEK,
  Year = 12 * MONTH
}

export const durationToString = (duration: Duration) => {
  switch (duration) {
    case Duration.Hour: return "Hour";
    case Duration.Day: return "Day";
    case Duration.Week: return "Week";
    case Duration.Month: return "Month";
    case Duration.Year: return "Year";
    default: return "Unknown";
  }
};
