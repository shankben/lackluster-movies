import "source-map-support/register";
import { App } from "@aws-cdk/core";
import DataStack from "../lib/stacks/DataStack";
import MachineStack from "../lib/stacks/MachineStack";

async function main() {
  const app = new App();
  const dataStack = new DataStack(app, "LackLusterMoviesDataStack");
  new MachineStack(app, "LackLusterMoviesMachineStack", {
    table: dataStack.table
  });
}

main().catch(console.error);
