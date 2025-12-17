package tests.java.movie;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.util.ArrayList;
import java.util.Arrays;

public class MovieTriviaTest {
    private MovieTrivia movieTrivia;

    @BeforeEach
    public void setUp() {
        movieTrivia = new MovieTrivia();
        // Add some initial data
        movieTrivia.insertActor("Meryl Streep", new String[]{"Doubt", "The Post"}, movieTrivia.actorsDB);
        movieTrivia.insertActor("Tom Hanks", new String[]{"The Post", "Cast Away"}, movieTrivia.actorsDB);
        movieTrivia.insertRating("Doubt", new int[]{79, 78}, movieTrivia.moviesDB);
        movieTrivia.insertRating("The Post", new int[]{88, 88}, movieTrivia.moviesDB);
    }

    @Test
    public void testInsertActor() {
        movieTrivia.insertActor("Brad Pitt", new String[]{"Seven", "Fight Club"}, movieTrivia.actorsDB);
        assertEquals(3, movieTrivia.actorsDB.size());
        assertTrue(movieTrivia.selectWhereActorIs("Brad Pitt", movieTrivia.actorsDB).contains("seven"));
    }

    @Test
    public void testInsertRating() {
        movieTrivia.insertRating("Seven", new int[]{29, 29}, movieTrivia.moviesDB);
        assertEquals(3, movieTrivia.moviesDB.size());
        // Find the movie "seven"
        MovieTrivia.Movie seven = null;
        for (MovieTrivia.Movie m : movieTrivia.moviesDB) {
            if (m.getName().equals("seven")) {
                seven = m;
                break;
            }
        }
        assertNotNull(seven);
        assertEquals(29, seven.getCriticsRating());
    }

    @Test
    public void testSelectWhereActorIs() {
        ArrayList<String> movies = movieTrivia.selectWhereActorIs("Meryl Streep", movieTrivia.actorsDB);
        assertEquals(2, movies.size());
        assertTrue(movies.contains("doubt"));
        assertTrue(movies.contains("the post"));
    }

    @Test
    public void testSelectWhereMovieIs() {
        ArrayList<String> actors = movieTrivia.selectWhereMovieIs("The Post", movieTrivia.actorsDB);
        assertEquals(2, actors.size());
        assertTrue(actors.contains("meryl streep"));
        assertTrue(actors.contains("tom hanks"));
    }

    @Test
    public void testSelectWhereRatingIs() {
        ArrayList<String> movies = movieTrivia.selectWhereRatingIs('>', 80, true, movieTrivia.moviesDB);
        assertEquals(1, movies.size());
        assertTrue(movies.contains("the post"));
    }

    @Test
    public void testGetCoActors() {
        ArrayList<String> coActors = movieTrivia.getCoActors("Meryl Streep", movieTrivia.actorsDB);
        assertEquals(1, coActors.size());
        assertTrue(coActors.contains("tom hanks"));
    }

    @Test
    public void testGetCommonMovie() {
        ArrayList<String> common = movieTrivia.getCommonMovie("Meryl Streep", "Tom Hanks", movieTrivia.actorsDB);
        assertEquals(1, common.size());
        assertTrue(common.contains("the post"));
    }

    @Test
    public void testGoodMovies() {
        ArrayList<String> good = movieTrivia.goodMovies(movieTrivia.moviesDB);
        assertEquals(1, good.size());
        assertTrue(good.contains("the post"));
    }

    @Test
    public void testGetCommonActors() {
        ArrayList<String> common = movieTrivia.getCommonActors("Doubt", "The Post", movieTrivia.actorsDB);
        assertEquals(1, common.size());
        assertTrue(common.contains("meryl streep"));
    }

    @Test
    public void testGetMean() {
        ArrayList<Integer> ratings = new ArrayList<>(Arrays.asList(80, 90, 100));
        assertEquals(90.0, movieTrivia.getMean(ratings), 0.01);
    }

    @Test
    public void testReadMovieData() {
        movieTrivia.actorsDB.clear();
        movieTrivia.readMovieData("tests/java/movie/moviedata.txt");
        assertFalse(movieTrivia.actorsDB.isEmpty());
        assertTrue(movieTrivia.selectWhereActorIs("Meryl Streep", movieTrivia.actorsDB).contains("doubt"));
    }

    @Test
    public void testReadMovieRatings() {
        movieTrivia.moviesDB.clear();
        movieTrivia.readMovieRatings("tests/java/movie/movieratings.csv");
        assertFalse(movieTrivia.moviesDB.isEmpty());
        ArrayList<String> good = movieTrivia.goodMovies(movieTrivia.moviesDB);
        // Arrival has 94, 82. Not good by my definition (>=85).
        // Let's check Jaws: 97, 90.
        assertTrue(good.contains("jaws"));
    }

    @Test
    public void testSelectWhereRatingIsEdgeCases() {
        // Edge cases for coverage
        assertEquals(0, movieTrivia.selectWhereRatingIs('=', 100, true, movieTrivia.moviesDB).size());
        assertEquals(0, movieTrivia.selectWhereRatingIs('<', 0, true, movieTrivia.moviesDB).size());
        assertEquals(0, movieTrivia.selectWhereRatingIs('?', 85, true, movieTrivia.moviesDB).size()); // Invalid operator
        
        // Test with null DB
        assertEquals(0, movieTrivia.selectWhereRatingIs('>', 85, true, null).size());
    }

    @Test
    public void testInsertRatingEdgeCases() {
        // Null movie name
        movieTrivia.insertRating(null, new int[]{90, 95}, movieTrivia.moviesDB);
        // Null ratings array
        movieTrivia.insertRating("new movie", null, movieTrivia.moviesDB);
        // Null DB
        movieTrivia.insertRating("new movie", new int[]{90, 95}, null);
        
        // Update existing movie
        movieTrivia.insertRating("doubt", new int[]{99, 99}, movieTrivia.moviesDB);
        for (MovieTrivia.Movie m : movieTrivia.moviesDB) {
            if (m.getName().equals("doubt")) {
                assertEquals(99, m.getCriticsRating());
            }
        }
    }

    @Test
    public void testInsertActorEdgeCases() {
        // Null actor name
        movieTrivia.insertActor(null, new String[]{"movie1"}, movieTrivia.actorsDB);
        // Null movies array
        movieTrivia.insertActor("new actor", null, movieTrivia.actorsDB);
        // Null DB
        movieTrivia.insertActor("new actor", new String[]{"movie1"}, null);
        
        // Update existing actor
        movieTrivia.insertActor("meryl streep", new String[]{"new movie"}, movieTrivia.actorsDB);
        for (MovieTrivia.Actor a : movieTrivia.actorsDB) {
            if (a.getName().equals("meryl streep")) {
                assertTrue(a.getMovies().contains("new movie"));
            }
        }
    }

    @Test
    public void testReadFilesEdgeCases() {
        // Non-existent files
        movieTrivia.readMovieData("nonexistent.txt");
        movieTrivia.readMovieRatings("nonexistent.csv");
    }

    @Test
    public void testGetMeanEdgeCases() {
        assertEquals(0.0, movieTrivia.getMean(null));
        assertEquals(0.0, movieTrivia.getMean(new ArrayList<>()));
    }
    
    @Test
    public void testMainMethod() {
        // Call main to get coverage
        MovieTrivia.main(new String[]{});
    }
}
