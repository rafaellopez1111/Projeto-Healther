package com.projetohealther.back.service;

import com.projetohealther.back.entity.AppUser;
import com.projetohealther.back.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
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
public class UserService {

    private static final List<String> GOALS = List.of("emagrecer", "ganhar massa muscular", "ganhar peso");

    private final UserRepository repository;
    private final ObjectMapper mapper;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public ObjectNode handle(String operation, int userId, JsonNode data) {
        ObjectNode result = mapper.createObjectNode();

        switch (operation) {
            case "create" -> {
                String name = data.path("user_name").asText();
                String email = data.path("user_email").asText();
                String password = data.path("user_password").asText();

                if (name.isBlank() || email.isBlank() || password.isBlank()) {
                    throw new IllegalArgumentException("user_name, user_email and user_password are required");
                }
                if (repository.existsByUserEmail(email)) {
                    throw new IllegalArgumentException("Email already registered");
                }
                if (data.has("user_goal") && !GOALS.contains(data.get("user_goal").asText())) {
                    throw new IllegalArgumentException("Invalid user_goal");
                }

                AppUser user = new AppUser();
                user.setUserName(name);
                user.setUserEmail(email);
                user.setUserPassword(encoder.encode(password));
                user.setUserGoal(data.path("user_goal").asText());
                user.setUserAge(data.path("user_age").asInt());
                user.setUserWeight(data.path("user_weight").asInt());
                if (data.has("user_birthdate")) {
                    user.setUserBirthdate(LocalDate.parse(data.get("user_birthdate").asText()));
                }
                user.setActive(true);

                repository.save(user);
                result.put("user_id", user.getUserId());
            }
            case "getone", "update", "delete" -> {
                AppUser user = repository.findByUserIdAndActiveTrue(userId)
                        .orElseThrow(() -> new IllegalArgumentException("User not found"));

                if (operation.equals("getone")) {
                    result.set("data", mapper.valueToTree(user));
                } else if (operation.equals("update")) {
                    if (data.has("user_goal")) {
                        if (!GOALS.contains(data.get("user_goal").asText())) {
                            throw new IllegalArgumentException("Invalid user_goal");
                        }
                        user.setUserGoal(data.get("user_goal").asText());
                    }
                    if (data.has("user_name")) {
                        user.setUserName(data.get("user_name").asText());
                    }
                    if (data.has("user_age")) {
                        user.setUserAge(data.get("user_age").asInt());
                    }
                    if (data.has("user_weight")) {
                        user.setUserWeight(data.get("user_weight").asInt());
                    }
                    if (data.has("user_birthdate")) {
                        user.setUserBirthdate(LocalDate.parse(data.get("user_birthdate").asText()));
                    }
                    if (data.has("user_email") && !data.get("user_email").asText().equals(user.getUserEmail())) {
                        if (repository.existsByUserEmail(data.get("user_email").asText())) {
                            throw new IllegalArgumentException("Email already registered");
                        }
                        user.setUserEmail(data.get("user_email").asText());
                    }
                    if (data.has("user_password") && !data.get("user_password").asText().isBlank()) {
                        user.setUserPassword(encoder.encode(data.get("user_password").asText()));
                    }
                    result.put("message", "User updated");
                } else {
                    user.setActive(false);
                    result.put("message", "User deleted");
                }
            }
            default -> throw new IllegalArgumentException("Unknown operation: " + operation);
        }

        return result;
    }
}