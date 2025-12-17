package tests.java.movie;

import java.util.ArrayList;

public class MovieTrivia {
    
    /**
     * Inner class representing an Actor and their movies.
     */
    public static class Actor {
        private String name;
        private ArrayList<String> movies;

        public Actor(String name) {
            this.name = name.trim().toLowerCase();
            this.movies = new ArrayList<>();
        }

        public String getName() {
            return name;
        }

        public ArrayList<String> getMovies() {
            return movies;
        }

        public void addMovie(String movie) {
            String normalizedMovie = movie.trim().toLowerCase();
            if (!movies.contains(normalizedMovie)) {
                movies.add(normalizedMovie);
            }
        }
    }

    /**
     * Inner class representing a Movie and its ratings.
     */
    public static class Movie {
        private String name;
        private int criticsRating;
        private int audienceRating;

        public Movie(String name, int criticsRating, int audienceRating) {
            this.name = name.trim().toLowerCase();
            this.criticsRating = criticsRating;
            this.audienceRating = audienceRating;
        }

        public String getName() {
            return name;
        }

        public int getCriticsRating() {
            return criticsRating;
        }

        public int getAudienceRating() {
            return audienceRating;
        }

        public void setCriticsRating(int criticsRating) {
            this.criticsRating = criticsRating;
        }

        public void setAudienceRating(int audienceRating) {
            this.audienceRating = audienceRating;
        }
    }

    public ArrayList<Actor> actorsDB = new ArrayList<>();
    public ArrayList<Movie> moviesDB = new ArrayList<>();

    /**
     * Reads movie data from a file and populates the actors database.
     * File format: Actor, Movie1, Movie2, ...
     */
    public void readMovieData(String filename) {
        try (java.util.Scanner scanner = new java.util.Scanner(new java.io.File(filename))) {
            while (scanner.hasNextLine()) {
                String line = scanner.nextLine();
                if (line.trim().isEmpty()) continue;
                String[] parts = line.split(",");
                if (parts.length > 0) {
                    String actor = parts[0].trim();
                    String[] movies = new String[parts.length - 1];
                    for (int i = 1; i < parts.length; i++) {
                        movies[i - 1] = parts[i].trim();
                    }
                    insertActor(actor, movies, actorsDB);
                }
            }
        } catch (java.io.FileNotFoundException e) {
            System.out.println("File not found: " + filename);
        }
    }

    /**
     * Reads movie ratings from a CSV file and populates the movies database.
     * File format: movie, critics, audience
     */
    public void readMovieRatings(String filename) {
        try (java.util.Scanner scanner = new java.util.Scanner(new java.io.File(filename))) {
            if (scanner.hasNextLine()) scanner.nextLine(); // Skip header
            while (scanner.hasNextLine()) {
                String line = scanner.nextLine();
                if (line.trim().isEmpty()) continue;
                String[] parts = line.split(",");
                if (parts.length == 3) {
                    String movie = parts[0].trim();
                    try {
                        int critics = Integer.parseInt(parts[1].trim());
                        int audience = Integer.parseInt(parts[2].trim());
                        insertRating(movie, new int[]{critics, audience}, moviesDB);
                    } catch (NumberFormatException e) {
                        // Skip invalid lines
                    }
                }
            }
        } catch (java.io.FileNotFoundException e) {
            System.out.println("File not found: " + filename);
        }
    }

    /**
     * Inserts an actor and their movies into the database.
     * If the actor already exists, adds the movies to their list.
     */
    public void insertActor(String actor, String[] movies, ArrayList<Actor> database) {
        String normalizedActor = actor.trim().toLowerCase();
        Actor existingActor = null;
        for (Actor a : database) {
            if (a.getName().equals(normalizedActor)) {
                existingActor = a;
                break;
            }
        }

        if (existingActor == null) {
            existingActor = new Actor(normalizedActor);
            database.add(existingActor);
        }

        for (String movie : movies) {
            existingActor.addMovie(movie);
        }
    }

    /**
     * Inserts a movie and its ratings into the database.
     * If the movie already exists, updates its ratings.
     */
    public void insertRating(String movie, int[] ratings, ArrayList<Movie> database) {
        if (ratings == null || ratings.length != 2) return;
        
        String normalizedMovie = movie.trim().toLowerCase();
        Movie existingMovie = null;
        for (Movie m : database) {
            if (m.getName().equals(normalizedMovie)) {
                existingMovie = m;
                break;
            }
        }

        if (existingMovie == null) {
            existingMovie = new Movie(normalizedMovie, ratings[0], ratings[1]);
            database.add(existingMovie);
        } else {
            existingMovie.setCriticsRating(ratings[0]);
            existingMovie.setAudienceRating(ratings[1]);
        }
    }

    /**
     * Returns a list of movies the actor has been in.
     */
    public ArrayList<String> selectWhereActorIs(String actor, ArrayList<Actor> database) {
        String normalizedActor = actor.trim().toLowerCase();
        for (Actor a : database) {
            if (a.getName().equals(normalizedActor)) {
                return new ArrayList<>(a.getMovies());
            }
        }
        return new ArrayList<>();
    }

    /**
     * Returns a list of actors who were in the movie.
     */
    public ArrayList<String> selectWhereMovieIs(String movie, ArrayList<Actor> database) {
        String normalizedMovie = movie.trim().toLowerCase();
        ArrayList<String> actors = new ArrayList<>();
        for (Actor a : database) {
            if (a.getMovies().contains(normalizedMovie)) {
                actors.add(a.getName());
            }
        }
        return actors;
    }

    /**
     * Returns a list of movies that satisfy the rating criteria.
     */
    public ArrayList<String> selectWhereRatingIs(char comparison, int targetRating, boolean isCritic, ArrayList<Movie> database) {
        ArrayList<String> movies = new ArrayList<>();
        for (Movie m : database) {
            int rating = isCritic ? m.getCriticsRating() : m.getAudienceRating();
            boolean match = false;
            switch (comparison) {
                case '=': match = (rating == targetRating); break;
                case '>': match = (rating > targetRating); break;
                case '<': match = (rating < targetRating); break;
            }
            if (match) {
                movies.add(m.getName());
            }
        }
        return movies;
    }

    /**
     * Returns a list of actors who have worked with the given actor.
     */
    public ArrayList<String> getCoActors(String actor, ArrayList<Actor> database) {
        String normalizedActor = actor.trim().toLowerCase();
        ArrayList<String> actorMovies = selectWhereActorIs(normalizedActor, database);
        ArrayList<String> coActors = new ArrayList<>();
        
        for (String movie : actorMovies) {
            ArrayList<String> actorsInMovie = selectWhereMovieIs(movie, database);
            for (String a : actorsInMovie) {
                if (!a.equals(normalizedActor) && !coActors.contains(a)) {
                    coActors.add(a);
                }
            }
        }
        return coActors;
    }

    /**
     * Returns a list of movies that both actors have been in.
     */
    public ArrayList<String> getCommonMovie(String actor1, String actor2, ArrayList<Actor> database) {
        ArrayList<String> movies1 = selectWhereActorIs(actor1, database);
        ArrayList<String> movies2 = selectWhereActorIs(actor2, database);
        ArrayList<String> common = new ArrayList<>();
        
        for (String m : movies1) {
            if (movies2.contains(m)) {
                common.add(m);
            }
        }
        return common;
    }

    /**
     * Returns a list of movies with both critic and audience ratings >= 85.
     */
    public ArrayList<String> goodMovies(ArrayList<Movie> database) {
        ArrayList<String> good = new ArrayList<>();
        for (Movie m : database) {
            if (m.getCriticsRating() >= 85 && m.getAudienceRating() >= 85) {
                good.add(m.getName());
            }
        }
        return good;
    }

    /**
     * Returns a list of actors who were in both movies.
     */
    public ArrayList<String> getCommonActors(String movie1, String movie2, ArrayList<Actor> database) {
        ArrayList<String> actors1 = selectWhereMovieIs(movie1, database);
        ArrayList<String> actors2 = selectWhereMovieIs(movie2, database);
        ArrayList<String> common = new ArrayList<>();
        
        for (String a : actors1) {
            if (actors2.contains(a)) {
                common.add(a);
            }
        }
        return common;
    }

    /**
     * Returns the mean of the given ratings.
     */
    public double getMean(ArrayList<Integer> ratings) {
        if (ratings == null || ratings.isEmpty()) return 0.0;
        double sum = 0;
        for (int r : ratings) {
            sum += r;
        }
        return sum / ratings.size();
    }

    public static void main(String[] args) {
        MovieTrivia mt = new MovieTrivia();
        mt.readMovieData("tests/java/movie/moviedata.txt");
        mt.readMovieRatings("tests/java/movie/movieratings.csv");

        System.out.println("Actors in database: " + mt.actorsDB.size());
        System.out.println("Movies in database: " + mt.moviesDB.size());

        System.out.println("Movies with Meryl Streep: " + mt.selectWhereActorIs("Meryl Streep", mt.actorsDB));
        System.out.println("Co-actors of Meryl Streep: " + mt.getCoActors("Meryl Streep", mt.actorsDB));
        System.out.println("Good movies: " + mt.goodMovies(mt.moviesDB));
    }
}
