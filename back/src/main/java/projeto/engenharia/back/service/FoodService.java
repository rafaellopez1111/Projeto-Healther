package com.projetohealther.back.service;

import com.projetohealther.back.entity.AfternoonSnack;
import com.projetohealther.back.entity.AppUser;
import com.projetohealther.back.entity.Breakfast;
import com.projetohealther.back.entity.Dinner;
import com.projetohealther.back.entity.FoodItem;
import com.projetohealther.back.entity.Lunch;
import com.projetohealther.back.repository.AfternoonSnackRepository;
import com.projetohealther.back.repository.BreakfastRepository;
import com.projetohealther.back.repository.DinnerRepository;
import com.projetohealther.back.repository.FoodRepository;
import com.projetohealther.back.repository.LunchRepository;
import com.projetohealther.back.repository.MealSuggestionRepository;
import com.projetohealther.back.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Supplier;

@Service
@RequiredArgsConstructor
@Transactional
public class FoodService {

    private final BreakfastRepository breakfastRepository;
    private final LunchRepository lunchRepository;
    private final AfternoonSnackRepository afternoonSnackRepository;
    private final DinnerRepository dinnerRepository;
    private final MealSuggestionRepository suggestionRepository;
    private final UserRepository userRepository;
    private final ObjectMapper mapper;

    public ObjectNode handle(String prefix, String operation, int userId, JsonNode data) {
        return switch (prefix) {
            case "breakfast" -> run(breakfastRepository, Breakfast::new, operation, userId, data);
            case "lunch" -> run(lunchRepository, Lunch::new, operation, userId, data);
            case "afternoon_snack" -> run(afternoonSnackRepository, AfternoonSnack::new, operation, userId, data);
            case "dinner" -> run(dinnerRepository, Dinner::new, operation, userId, data);
            case "meal" -> {
                ObjectNode result = mapper.createObjectNode();

                switch (operation) {
                    case "getall" -> {
                        LocalDate date = data.has("reference_date")
                                ? LocalDate.parse(data.get("reference_date").asText())
                                : LocalDate.now();

                        ObjectNode meals = mapper.createObjectNode();
                        meals.set("breakfast", mapper.valueToTree(breakfastRepository.findLatestByDate(userId, date)));
                        meals.set("lunch", mapper.valueToTree(lunchRepository.findLatestByDate(userId, date)));
                        meals.set("afternoon_snack", mapper.valueToTree(afternoonSnackRepository.findLatestByDate(userId, date)));
                        meals.set("dinner", mapper.valueToTree(dinnerRepository.findLatestByDate(userId, date)));
                        result.set("data", meals);
                    }
                    case "getsuggestions" -> {
                        String mealType = data.path("meal_type").asText();
                        if (mealType.isBlank()) {
                            throw new IllegalArgumentException("meal_type is required");
                        }
                        AppUser user = userRepository.findByUserIdAndActiveTrue(userId)
                                .orElseThrow(() -> new IllegalArgumentException("User not found"));

                        result.set("data", mapper.valueToTree(
                                suggestionRepository.findByMealTypeAndUserGoalOrderByMealOption(mealType, user.getUserGoal())));
                    }
                    default -> throw new IllegalArgumentException("Unknown action: meal_" + operation);
                }
                yield result;
            }
            default -> throw new IllegalArgumentException("Unknown action: " + prefix + "_" + operation);
        };
    }

    private <T extends FoodItem> ObjectNode run(FoodRepository<T> repository, Supplier<T> newItem,
                                                String operation, int userId, JsonNode data) {
        ObjectNode result = mapper.createObjectNode();

        switch (operation) {
            case "create", "update" -> {
                boolean isUpdate = operation.equals("update");

                JsonNode foods = data.path("foods");
                if (!foods.isArray() || foods.isEmpty()) {
                    throw new IllegalArgumentException("foods is required");
                }

                AppUser user = userRepository.findByUserIdAndActiveTrue(userId)
                        .orElseThrow(() -> new IllegalArgumentException("User not found"));

                LocalDate referenceDate = data.has("reference_date")
                        ? LocalDate.parse(data.get("reference_date").asText())
                        : null;

                int mealId;
                int version;

                if (isUpdate) {
                    mealId = data.path("meal_id").asInt();
                    if (mealId == 0) {
                        throw new IllegalArgumentException("meal_id is required");
                    }
                    List<T> current = repository.findLatest(mealId, userId);
                    if (current.isEmpty()) {
                        throw new IllegalArgumentException("Meal not found");
                    }
                    version = current.get(0).getVersion() + 1;
                    if (referenceDate == null) {
                        referenceDate = current.get(0).getReferenceDate();
                    }
                } else {
                    mealId = repository.nextMealId().intValue();
                    version = 1;
                    if (referenceDate == null) {
                        referenceDate = LocalDate.now();
                    }
                }

                List<T> items = new ArrayList<>();
                for (JsonNode food : foods) {
                    String name = food.path("specific_food").asText();
                    if (name.isBlank()) {
                        throw new IllegalArgumentException("specific_food is required for every food");
                    }

                    T item = newItem.get();
                    item.setMealId(mealId);
                    item.setVersion(version);
                    item.setActive(true);
                    item.setUserId(userId);
                    item.setUserName(user.getUserName());
                    item.setUpdatedBy(user.getUserName());
                    item.setReferenceDate(referenceDate);
                    item.setSpecificFood(name);
                    item.setFoodAmount(food.path("food_amount").asInt());
                    item.setTotalCalories(food.path("total_calories").asInt());
                    items.add(item);
                }

                repository.saveAll(items);
                result.put("meal_id", mealId);
                result.put("version", version);
            }
            case "getone" -> {
                int mealId = data.path("meal_id").asInt();
                if (mealId == 0) {
                    throw new IllegalArgumentException("meal_id is required");
                }
                List<T> foods = repository.findLatest(mealId, userId);
                if (foods.isEmpty()) {
                    throw new IllegalArgumentException("Meal not found");
                }
                result.set("data", mapper.valueToTree(foods));
            }
            case "delete" -> {
                int mealId = data.path("meal_id").asInt();
                if (mealId == 0) {
                    throw new IllegalArgumentException("meal_id is required");
                }
                List<T> rows = repository.findByMealIdAndUserId(mealId, userId);
                if (rows.isEmpty()) {
                    throw new IllegalArgumentException("Meal not found");
                }
                rows.forEach(row -> row.setActive(false));
                result.put("message", "Meal deleted");
            }
            default -> throw new IllegalArgumentException("Unknown operation: " + operation);
        }

        return result;
    }
}