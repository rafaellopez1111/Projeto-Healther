package com.projetohealther.back.service;

import com.projetohealther.back.entity.Recipe;
import com.projetohealther.back.repository.RecipeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class RecipeService {

    private final RecipeRepository repository;
    private final ObjectMapper mapper;

    public ObjectNode handle(String operation, int userId, JsonNode data) {
        ObjectNode result = mapper.createObjectNode();

        switch (operation) {
            case "create" -> {
                String name = data.path("recipe_name").asText();
                if (name.isBlank()) {
                    throw new IllegalArgumentException("recipe_name is required");
                }

                Recipe recipe = new Recipe();
                recipe.setRecipeId(repository.nextRecipeId().intValue());
                recipe.setVersion(1);
                recipe.setUserId(userId);
                recipe.setActive(true);
                recipe.setRecipeName(name);
                recipe.setCreatedBy(data.path("created_by").asText());
                recipe.setCreatedAt(LocalDate.now());
                recipe.setRecipeSteps(data.path("recipe_steps").asText());
                recipe.setCaloriesPortion(data.path("calories_portion").asInt());
                recipe.setRecipeIngredients(data.has("recipe_ingredients")
                        ? data.get("recipe_ingredients").toString()
                        : "[]");

                repository.save(recipe);
                result.put("recipe_id", recipe.getRecipeId());
            }
            case "getall" -> {
                ArrayNode list = mapper.createArrayNode();
                for (Recipe recipe : repository.findAllLatest(userId)) {
                    list.add(toJson(recipe));
                }
                result.set("data", list);
            }
            case "getone", "update", "delete" -> {
                int recipeId = data.path("recipe_id").asInt();
                if (recipeId == 0) {
                    throw new IllegalArgumentException("recipe_id is required");
                }

                Recipe latest = repository
                        .findFirstByRecipeIdAndUserIdAndActiveTrueOrderByVersionDesc(recipeId, userId)
                        .orElseThrow(() -> new IllegalArgumentException("Recipe not found"));

                if (operation.equals("getone")) {
                    result.set("data", toJson(latest));
                } else if (operation.equals("update")) {
                    Recipe next = new Recipe();
                    next.setRecipeId(recipeId);
                    next.setVersion(latest.getVersion() + 1);
                    next.setUserId(userId);
                    next.setActive(true);
                    next.setCreatedBy(latest.getCreatedBy());
                    next.setCreatedAt(latest.getCreatedAt());
                    next.setRecipeName(data.has("recipe_name")
                            ? data.get("recipe_name").asText() : latest.getRecipeName());
                    next.setRecipeSteps(data.has("recipe_steps")
                            ? data.get("recipe_steps").asText() : latest.getRecipeSteps());
                    next.setCaloriesPortion(data.has("calories_portion")
                            ? data.get("calories_portion").asInt() : latest.getCaloriesPortion());
                    next.setRecipeIngredients(data.has("recipe_ingredients")
                            ? data.get("recipe_ingredients").toString() : latest.getRecipeIngredients());

                    repository.save(next);
                    result.put("version", next.getVersion());
                } else {
                    List<Recipe> versions = repository.findByRecipeIdAndUserId(recipeId, userId);
                    versions.forEach(version -> version.setActive(false));
                    result.put("message", "Recipe deleted");
                }
            }
            default -> throw new IllegalArgumentException("Unknown operation: " + operation);
        }

        return result;
    }

    private ObjectNode toJson(Recipe recipe) {
        ObjectNode node = mapper.valueToTree(recipe);
        try {
            node.set("recipe_ingredients", recipe.getRecipeIngredients() == null
                    ? mapper.createArrayNode()
                    : mapper.readTree(recipe.getRecipeIngredients()));
        } catch (Exception e) {
            throw new IllegalStateException("Invalid JSON stored in RecipeIngredients", e);
        }
        return node;
    }
}