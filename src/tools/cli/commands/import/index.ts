process.env.TABLE_NAME = "LackLusterMovies";
process.env.AWS_REGION = "us-east-1";

import fs from "fs";
import path from "path";
import crypto from "crypto";

import * as AWS from "aws-sdk";
import parse from "csv-parse/lib/sync";
import camelCase from "camelcase";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 4 * WEEK;
const YEAR = 12 * MONTH;

const CSV_PATH = path.join(__dirname, "..", "..", "..", "..", "..", "data",
  "csv");

AWS.config.update({ region: process.env.AWS_REGION ?? "us-east-1" });

import {
  repository,
  remapKey,
  tryMakeNumber,
  tryFormatCurrency,
  tryMakeDateString
} from "../../../../core";

import { Movie } from "../../../../core/repository/movies";
import { User } from "../../../../core/repository/users";

const remapExcludedCharacters = (it: string) => it.replace(/[@’?# ]/ig, "");

export const cleanItem = (
  it: Record<string, string>
) => Object.fromEntries(Object
  .entries(it)
  .map(([k, v]) => [camelCase(k), v])
  .map(([k, v]) => [remapExcludedCharacters(k as string), v])
  .map(([k, v]) => [k, tryMakeNumber(v as string)])
  .map(([k, v]) => [k, tryFormatCurrency(v as string)])
  .map(([k, v]) => k === "title" ? [k, /y/i.test(v as string)] : [k, v])
  .map(([k, v]) =>  ["date", "expiration"]
    .map((re) => new RegExp(re, "i").test(k as string))
    .reduce((x, y) => x || y, false) ?
      [k, tryMakeDateString(v as string)] :
      [k, v])
  .map(([k, v]) => k === "zipcode" ? [k, `${v}`] : [k, v])
  .filter(([_, v]) => v !== "")
);

const importCsv = async (fileName: string) => {
  const file = fs.readFileSync(path.join(CSV_PATH, fileName));
  const parseOptions = {
    columns: true,
    skipEmptyLines: true
  };
  return parse(file, parseOptions)
    .map((it: Record<string, string>) => cleanItem(it));
};

export const importMovies = async (limit = 10) => {
  const movies: any[] = (await importCsv("eighties.csv") as any[])
    .map((it) => remapKey(it, "tconst", "imdbId"))
    .map((it) => remapKey(it, "genre1", "genre"))
    .map((it) => remapKey(it, "genre2", "subgenre"))
    .map((it) => remapKey(it, "primaryTitle", "title"))
    .map((it) => remapKey(it, "startYear", "year"))
    .map((it) => remapKey(it, "primaryName", "director"))
    .map((it) => {
      delete it.primaryTitle;
      delete it.originalTitle;
      delete it.genre3;

      it.purchasePrice = 9 * (1 + Math.random());
      it.rentalPrice = it.purchasePrice / 5;
      it.status = "Available";
      it.conditionAtAcquisition = Math.random() < 0.5 ? "Mint" : "Good";
      it.condition = Math.random() < 0.5 ? "Good" :
        Math.random() < 0.5 ? "Fair" :
        "Poor";
      it.format = Math.random() < 0.9 ? "VHS" : "LaserDisc";

      return it;
    });

  await Promise.all(movies
    .slice(0, limit)
    .map((it) => repository
    .insertMovie(it)
    .catch((err) => console.error(err.message))));
};

export const importUsers = async (limit = 5) => {
  const randomDateOfBirth = () => {
    const year = 1960 + Math.floor(Math.random() * Math.floor(40));

    let month: string | number = 1 + Math.floor(Math.random() * Math.floor(11));
    month = month < 10 ? `0${month}` : month;

    let day: string | number = 1 + Math.floor(Math.random() * Math.floor(29));
    day = day < 10 ? `0${day}` : day;

    return `${month}-${day}-${year}`;
  };

  const users = (await importCsv("users.csv"))
    .slice(0, limit)
    .map((it: Record<string, any>) => {
      it.membershipId = crypto.createHash("sha256")
        .update(`${it.firstName}|${it.lastName}|${it.email}`)
        .digest()
        .toString("base64")
        .replace(/[+/]/, "")
        .substring(0, 8);
      delete it.id;
      it.dateOfBirth = randomDateOfBirth();
      it.status = Math.random() < 0.9 ? "Active" : "Expired";
      return it;
    });

  await Promise.all(users.map((it: any) => repository
    .insertUser(it)
    .catch((err) => console.error(err.message))));
};

export const importRentals = async () => {
  const randomMovie = (movies: Movie[]) =>
    movies[Math.floor(Math.random() * Math.floor(movies.length))];
  const now = new Date();
  const users = await repository.listUsers();
  const movies = await repository.listMovies();

  const movie = randomMovie(movies);
  const dueAt = new Date(Number(now) + (10 * MINUTE));
  await repository.rentMovie(users[0], movie, dueAt);

  // for (const user of users) {
  //   const movie = randomMovie(movies);
  //   const dueAt = new Date(Number(now) + (10 * MINUTE));
  //   await repository.rentMovie(user, movie, dueAt);
  // }

};

export const importAll = async () => {
  await importUsers(2);
  await importMovies(20);
  // await importRentals();
};
