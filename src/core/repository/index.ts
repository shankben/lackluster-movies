import { ListOptions } from "./meta";
import Users, { User, UserKey, UserUpdate } from "./users";
import Movies, { MovieKey, Movie, MovieUpdate, MovieSearch } from "./movies";
import Rentals, {
  Rental,
  RentalKey,
  RentalUpdate,
  RentalSearch
} from "./rentals";

class Repository {
  //// Users
  async insertUser(spec: User) {
    return await Users.insert(spec);
  }

  async listUsers(opts?: ListOptions) {
    return await Users.list(opts);
  }

  async findUser(spec: UserUpdate) {
    const users = await Users.byAttributes(spec, 1);
    if (users.length !== 1) {
      throw new Error("User not found: " + JSON.stringify(spec, null, 2));
    }
    return users.shift()!;
  }

  async findUsers(spec: UserUpdate) {
    return await Users.byAttributes(spec);
  }

  async updateUser(key: UserKey, spec: UserUpdate) {
    return await Users.update(key, spec);
  }

  //// Movies
  async insertMovie(spec: Movie) {
    return await Movies.insert(spec);
  }

  async updateMovie(key: MovieKey, spec: MovieUpdate) {
    return await Movies.update(key, spec);
  }

  async listMovies(opts?: ListOptions) {
    return await Movies.list(opts);
  }

  async findMovies(spec: MovieSearch) {
    return await Movies.byAttributes(spec);
  }

  //// Rentals
  async rentMovie(user: User, movie: Movie, dueAt: Date) {
    if (movie.status === "Rented") {
      console.log(movie);
      const { user } = await this.findRental({ movieImdbId: movie.imdbId });
      throw new Error(
        `${user.firstName} ${user.lastName} / ` +
        `${user.membershipId} has already rented ` +
        `"${movie.title}" / ${movie.imdbId}`
      );
    }

    if (user.moviesRented >= 3) {
      throw new Error(
        `${user.firstName} ${user.lastName} / ` +
        `${user.membershipId} has to return some video tapes.`
      );
    }

    await this.updateMovie(
      { pk: movie.pk, sk: movie.sk },
      { status: "Rented" }
    );

    await Users.incMoviesRented(user);

    await this.insertRental(
      { moviePartitionKey: movie.pk, userPartitionKey: user.pk },
      {
        dueAt,
        monthlyRate: movie.rentalPrice,
        rentedAt: new Date(),
        status: "Current"
      }
    );
  }

  async insertRental(key: RentalKey, spec: RentalUpdate) {
    return await Rentals.insert(key, spec);
  }

  async listRentals(opts?: ListOptions) {
    return await Rentals.list(opts);
  }

  async findRental(spec: RentalSearch): Promise<Rental> {
    const rentals = await Rentals.byAttributes(spec, 1);
    if (rentals.length !== 1) {
      throw new Error("Rental not found: " + JSON.stringify(spec, null, 2));
    }
    return rentals.shift()!;
  }

  async findRentals(spec: RentalSearch) {
    return await Rentals.byAttributes(spec);
  }

  async updateRental(key: RentalKey, spec: RentalUpdate) {
    return await Rentals.update(key, spec);
  }
}

export default new Repository();
