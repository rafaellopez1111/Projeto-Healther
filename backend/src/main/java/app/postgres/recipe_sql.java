package app.postgres;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;

public class recipe_sql {
    private Connection connection;
    private ObjectMapper mapper;

    public recipe_sql(Connection connection, ObjectMapper mapper) {
        this.connection = connection;
        this.mapper = mapper;
    }

    public Connection getConnection() {
        return connection;
    }

    public void setConnection(Connection connection) {
        this.connection = connection;
    }

    public int getVersion(int recipeId) throws SQLException {
        String sql = """
                SELECT "Version" FROM TB_RECIPES
                WHERE "RecipeId" = ?
                ORDER BY "Version" DESC
                LIMIT 1
                """;
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, recipeId);
            try (ResultSet rs = statement.executeQuery()) {
                return rs.next() ? rs.getInt("Version") : 0;
            }
        }
    }

    private ObjectNode rowToJson(ResultSet rs) throws SQLException {
        ObjectNode node = mapper.createObjectNode();
        node.put("recipe_id", rs.getInt("RecipeId"));
        node.put("recipe_name", rs.getString("RecipeName"));
        node.put("created_by", rs.getString("CreatedBy"));
        node.put("created_at", String.valueOf(rs.getDate("CreatedAt")));
        node.put("recipe_steps", rs.getString("RecipeSteps"));
        node.put("version", rs.getInt("Version"));
        node.put("user_id", rs.getInt("UserId"));
        node.put("is_active", rs.getBoolean("IsActive"));
        node.put("calories_portion", rs.getInt("CaloriesPortion"));

        String ingredients = rs.getString("RecipeIngredients");
        try {
            node.set("recipe_ingredients",
                    ingredients == null ? mapper.createArrayNode() : mapper.readTree(ingredients));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Invalid JSON stored in RecipeIngredients", e);
        }
        return node;
    }

    public int createRecipe(JsonNode request) throws SQLException {
        int userId = request.path("userid").asInt();
        JsonNode data = request.path("data");

        String recipeName = data.path("recipe_name").asText();
        String createdBy = data.path("created_by").asText();
        LocalDate createdAt = LocalDate.now();
        String recipeSteps = data.path("recipe_steps").asText();
        boolean isActive = true;
        int caloriesPortion = data.path("calories_portion").asInt();
        String recipeIngredients = data.has("recipe_ingredients")
                ? data.get("recipe_ingredients").toString()
                : "[]";

        String sql = """
                INSERT INTO TB_RECIPES
                    ("RecipeId", "RecipeName", "CreatedBy", "CreatedAt", "RecipeIngredients",
                     "RecipeSteps", "Version", "UserId", "IsActive", "CaloriesPortion")
                VALUES ((SELECT COALESCE(MAX("RecipeId"), 0) + 1 FROM TB_RECIPES),
                        ?, ?, ?, ?::json, ?, 1, ?, ?, ?)
                RETURNING "RecipeId"
                """;

        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, recipeName);
            statement.setString(2, createdBy);
            statement.setObject(3, createdAt);
            statement.setString(4, recipeIngredients);
            statement.setString(5, recipeSteps);
            statement.setInt(6, userId);
            statement.setBoolean(7, isActive);
            statement.setInt(8, caloriesPortion);

            try (ResultSet rs = statement.executeQuery()) {
                rs.next();
                return rs.getInt("RecipeId");
            }
        }
    }

    public ObjectNode getOneRecipe(JsonNode request) throws SQLException {
        int userId = request.path("userid").asInt();
        int recipeId = request.path("data").path("recipe_id").asInt();
        if (recipeId == 0) {
            throw new IllegalArgumentException("recipe_id is required");
        }

        String sql = """
                SELECT * FROM TB_RECIPES
                WHERE "RecipeId" = ? AND "UserId" = ?
                ORDER BY "Version" DESC
                LIMIT 1
                """;

        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, recipeId);
            statement.setInt(2, userId);

            try (ResultSet rs = statement.executeQuery()) {
                if (!rs.next() || !rs.getBoolean("IsActive")) {
                    return null;
                }
                return rowToJson(rs);
            }
        }
    }

    public ArrayNode getAllRecipes(JsonNode request) throws SQLException {
        int userId = request.path("userid").asInt();

        String sql = """
                SELECT * FROM (
                    SELECT DISTINCT ON ("RecipeId") *
                    FROM TB_RECIPES
                    WHERE "UserId" = ?
                    ORDER BY "RecipeId", "Version" DESC
                ) latest
                WHERE "IsActive" = true
                ORDER BY "RecipeId"
                """;

        ArrayNode result = mapper.createArrayNode();

        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, userId);

            try (ResultSet rs = statement.executeQuery()) {
                while (rs.next()) {
                    result.add(rowToJson(rs));
                }
            }
        }
        return result;
    }

    public void updateRecipe(JsonNode request) throws SQLException {
        int userId = request.path("userid").asInt();
        JsonNode data = request.path("data");

        int recipeId = data.path("recipe_id").asInt();
        if (recipeId == 0) {
            throw new IllegalArgumentException("recipe_id is required");
        }
        if (getVersion(recipeId) == 0) {
            throw new IllegalArgumentException("Recipe not found: " + recipeId);
        }

        String recipeName = data.path("recipe_name").asText();
        String createdBy = data.path("created_by").asText();
        LocalDate createdAt = LocalDate.now();
        String recipeSteps = data.path("recipe_steps").asText();
        boolean isActive = data.path("is_active").asBoolean(true);
        int caloriesPortion = data.path("calories_portion").asInt();
        String recipeIngredients = data.has("recipe_ingredients")
                ? data.get("recipe_ingredients").toString()
                : "[]";

        String sql = """
                INSERT INTO TB_RECIPES
                    ("RecipeId", "RecipeName", "CreatedBy", "CreatedAt", "RecipeIngredients",
                     "RecipeSteps", "Version", "UserId", "IsActive", "CaloriesPortion")
                VALUES (?, ?, ?, ?, ?::json, ?,
                        (SELECT COALESCE(MAX("Version"), 0) + 1 FROM TB_RECIPES WHERE "RecipeId" = ?),
                        ?, ?, ?)
                """;

        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, recipeId);
            statement.setString(2, recipeName);
            statement.setString(3, createdBy);
            statement.setObject(4, createdAt);
            statement.setString(5, recipeIngredients);
            statement.setString(6, recipeSteps);
            statement.setInt(7, recipeId);
            statement.setInt(8, userId);
            statement.setBoolean(9, isActive);
            statement.setInt(10, caloriesPortion);
            statement.executeUpdate();
        }
    }
}