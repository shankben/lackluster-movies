import {
  APIGatewayProxyEvent as Event,
  APIGatewayProxyResult as Result
} from "aws-lambda";

export const handler = async (event: Event): Promise<Result> => {
  const core = await import(
    process.env.AWS_EXECUTION_ENV ?
      "lackluster-movies-core" :
      "../../../../core"
  );
  const { repository } = core;
  const movies = await repository.listMovies();
  return {
    statusCode: 200,
    body: JSON.stringify(movies, null, 2)
  };
};
