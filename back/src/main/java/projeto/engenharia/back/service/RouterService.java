package com.projetohealther.back.service;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

import java.time.DateTimeException;

@Service
@RequiredArgsConstructor
public class RouterService {

    private final FoodService foodService;
    private final ExerciseService exerciseService;
    private final RecipeService recipeService;
    private final UserService userService;
    private final ObjectMapper mapper;

    public ObjectNode handle(JsonNode request) {
        String action = request.path("action").asText();
        int userId = request.path("userid").asInt();
        JsonNode data = request.path("data");

        int cut = action.lastIndexOf('_');
        if (cut < 0) {
            return error("Missing or invalid action");
        }

        String prefix = action.substring(0, cut);
        String operation = action.substring(cut + 1);

        if (userId == 0 && !action.equals("user_create")) {
            return error("userid is required");
        }

        try {
            ObjectNode result = switch (prefix) {
                case "breakfast", "lunch", "afternoon_snack", "dinner", "meal" ->
                        foodService.handle(prefix, operation, userId, data);
                case "exercise" -> exerciseService.handle(operation, userId, data);
                case "recipe" -> recipeService.handle(operation, userId, data);
                case "user" -> userService.handle(operation, userId, data);
                default -> throw new IllegalArgumentException("Unknown action: " + action);
            };

            ObjectNode response = mapper.createObjectNode();
            response.put("success", true);
            response.setAll(result);
            return response;

        } catch (IllegalArgumentException e) {
            return error(e.getMessage());
        } catch (DateTimeException e) {
            return error("Invalid date, use yyyy-MM-dd");
        } catch (DataAccessException e) {
            e.printStackTrace();
            return error("Database error");
        } catch (RuntimeException e) {
            e.printStackTrace();
            return error("Invalid request");
        }
    }

    private ObjectNode error(String message) {
        ObjectNode response = mapper.createObjectNode();
        response.put("success", false);
        response.put("message", message);
        return response;
    }
}