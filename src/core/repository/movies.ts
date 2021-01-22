import Meta, { ItemPrimitive, ListOptions } from "./meta";

export type MovieCondition = "Mint" | "Good" | "Fair" | "Poor";
export type MovieFormat = "VHS" | "LaserDisc";
export type MovieStatus = "Available" | "Rented";

export interface MovieKey {
  pk: string,
  sk: string
}

export interface MovieUpdate {
  acquiredAt?: Date;
  condition?: MovieCondition;
  conditionAtAcquisition?: MovieCondition;
  director?: string;
  format?: MovieFormat;
  genre?: string;
  imdbId?: string;
  purchasePrice?: number;
  rentalPrice?: number;
  status?: MovieStatus;
  subgenre?: string;
  title?: string;
  year?: number;
}

export interface Movie extends ItemPrimitive {
  acquiredAt: Date;
  condition: MovieCondition;
  conditionAtAcquisition: MovieCondition;
  director: string;
  format: MovieFormat;
  genre: string;
  imdbId: string;
  purchasePrice: number;
  rentalPrice: number;
  status: MovieStatus;
  subgenre: string;
  title: string;
  year: number;
}

export interface MovieSearch {
  acquiredAt?: Date;
  condition?: MovieCondition;
  conditionAtAcquisition?: MovieCondition;
  director?: string;
  format?: MovieFormat;
  genre?: string;
  imdbId?: string;
  purchasePrice?: number;
  rentalPrice?: number;
  status?: MovieStatus;
  subgenre?: string;
  title?: string;
  year?: number;
}


class Movies {
  private static readonly ENTITY_TYPE = "Movie";
  private static readonly PKA = "imdbId";

  partitionKey(movie: Movie) {
    return `${Movies.ENTITY_TYPE}|${movie[Movies.PKA]}`;
  }

  sortKey(movie: Movie) {
    return [
      Movies.ENTITY_TYPE,
      movie.year,
      movie.director,
      movie.genre,
      movie.title
    ].join("|");
  }

  get entityType() {
    return Movies.ENTITY_TYPE;
  }

  //// Create
  async insert(spec: Movie) {
    if (!(Movies.PKA in spec)) {
      throw new Error(`No ${Movies.PKA} defined`);
    }
    return await Meta.insert<Movie>(
      this.partitionKey(spec),
      this.sortKey(spec),
      {
        ...spec,
        gk: Movies.ENTITY_TYPE
      }
    );
  }

  //// Update
  async update(key: MovieKey, spec: MovieUpdate) {
    return Meta.update<Movie>(key.pk, key.sk, spec);
  }

  //// Read
  async list(opts?: ListOptions) {
    return await Meta.list<Movie>({
      entityType: Movies.ENTITY_TYPE,
      ...opts
    });
  }

  async byAttributes(spec: MovieSearch) {
    return await Meta.itemsByAttributes<MovieSearch, Movie>(
      { gk: Movies.ENTITY_TYPE },
      spec
    );
  }
}

export default new Movies();
