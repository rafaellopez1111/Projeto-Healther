package com.projetohealther.back.service;

import com.projetohealther.back.entity.Exercise;
import com.projetohealther.back.repository.ExerciseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ExerciseService {

    private final ExerciseRepository repository;
    private final ObjectMapper mapper;

    public ObjectNode handle(String operation, int userId, JsonNode data) {
        ObjectNode result = mapper.createObjectNode();

        switch (operation) {
            case "create" -> {
                String name = data.path("exercise_name").asText();
                if (name.isBlank()) {
                    throw new IllegalArgumentException("exercise_name is required");
                }

                Exercise exercise = new Exercise();
                exercise.setUserId(userId);
                exercise.setExerciseName(name);
                exercise.setTotalMinutes(data.path("total_minutes").asInt());
                exercise.setTotalCalories(data.path("total_calories").asInt());
                exercise.setExerciseDate(data.has("exercise_date")
                        ? LocalDate.parse(data.get("exercise_date").asText())
                        : LocalDate.now());
                exercise.setVersion(1);
                exercise.setActive(true);

                repository.save(exercise);
                result.put("exercise_id", exercise.getExerciseId());
            }
            case "getall" -> {
                List<Exercise> exercises = data.has("exercise_date")
                        ? repository.findByUserIdAndExerciseDateAndActiveTrue(
                        userId, LocalDate.parse(data.get("exercise_date").asText()))
                        : repository.findByUserIdAndActiveTrueOrderByExerciseDateDesc(userId);
                result.set("data", mapper.valueToTree(exercises));
            }
            case "getone", "update", "delete" -> {
                int exerciseId = data.path("exercise_id").asInt();
                if (exerciseId == 0) {
                    throw new IllegalArgumentException("exercise_id is required");
                }

                Exercise exercise = repository.findByExerciseIdAndUserIdAndActiveTrue(exerciseId, userId)
                        .orElseThrow(() -> new IllegalArgumentException("Exercise not found"));

                if (operation.equals("getone")) {
                    result.set("data", mapper.valueToTree(exercise));
                } else if (operation.equals("update")) {
                    if (data.has("exercise_name")) {
                        exercise.setExerciseName(data.get("exercise_name").asText());
                    }
                    if (data.has("total_minutes")) {
                        exercise.setTotalMinutes(data.get("total_minutes").asInt());
                    }
                    if (data.has("total_calories")) {
                        exercise.setTotalCalories(data.get("total_calories").asInt());
                    }
                    if (data.has("exercise_date")) {
                        exercise.setExerciseDate(LocalDate.parse(data.get("exercise_date").asText()));
                    }
                    exercise.setVersion((exercise.getVersion() == null ? 0 : exercise.getVersion()) + 1);
                    repository.save(exercise);
                    result.put("message", "Exercise updated");
                } else {
                    exercise.setActive(false);
                    repository.save(exercise);
                    result.put("message", "Exercise deleted");
                }
            }
            default -> throw new IllegalArgumentException("Unknown operation: " + operation);
        }

        return result;
    }
}