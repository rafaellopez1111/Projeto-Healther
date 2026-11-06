package app.postgres;
import io.github.cdimascio.dotenv.Dotenv;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class postgres_connection {
    public static Connection getConnection() throws SQLException {
        Dotenv dotenv = Dotenv.load();
        Connection connection = DriverManager.getConnection(
                "jdbc:postgresql://localhost:8080/project-healther", "postgres",
                dotenv.get("SENHA_DB"));
        System.out.println("Conexao bem sucedida");
        return connection;
    }
}
