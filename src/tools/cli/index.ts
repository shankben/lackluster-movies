process.env.TABLE_NAME = "LackLusterMovies";
process.env.AWS_REGION = "us-east-1";

import { repository } from "../../core";
import * as commands from "./commands";

function parseArgv(argv: string[]) {
  const verb = argv[0];
  const entity = argv[1];
  const args = argv.slice(2);
  const spec: Record<string, string> = {};
  if (args.length >= 2) {
    for (let i = 0; i < args.length; i += 2) {
      spec[args[i].replace(/^--/, "")] = args[i + 1];
    }
  }

  switch (verb) {
    case "wipe-table":
      return commands.wipeTable;

    case "import-all":
      return commands.importAll;

    case "import":
      switch (entity) {
        case "rentals":
          return commands.importRentals;
      }
      break;

    case "list":
      switch (entity) {
        case "users":
          return Object.keys(spec).length ?
            () => repository.findUsers(spec) :
            repository.listUsers;
        case "movies":
          return Object.keys(spec).length ?
            () => repository.findMovies(spec) :
            repository.listMovies;
        case "rentals":
          return Object.keys(spec).length ?
            () => repository.findRentals(spec) :
            repository.listRentals;
      }
  }
  return () => {
    throw new Error(`Unknown command ${argv}`);
  };
}

async function main() {
  let res;

  const argv = [...process.argv].slice(2);
  const command = parseArgv(argv);

  console.log(argv);

  try {
    res = await command();
    console.dir(res, { depth: null });
  } catch (err) {
    console.error(err.message);
  }

  process.exit(0);
}

main().catch(console.error);
