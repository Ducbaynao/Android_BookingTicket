package com.example.Android;

import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;
import com.example.Android.Models.User;
import com.example.Android.Repositories.UserRepository;
import com.example.Android.Services.UserStatsService;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
@EnableScheduling
public class AndroidApplication {

	private final PasswordEncoder passwordEncoder;

	AndroidApplication(PasswordEncoder passwordEncoder) {
		this.passwordEncoder = passwordEncoder;
	}

	public static void main(String[] args) {
		SpringApplication.run(AndroidApplication.class, args);
	}

	@Bean
	ApplicationRunner init(UserRepository userRepository, UserStatsService userStatsService) {
		return args -> {
			String encodedPassword = passwordEncoder.encode("123456");
			if (userRepository.findUserByRole("ADMIN").isEmpty()) {
				User user = User.builder()
						.name("admin")
						.email("madung1409@gmail.com")
						.password(encodedPassword)
						.role("ADMIN")
						.build();
				userRepository.save(user);
				userStatsService.onUserCreated();
			}
			userStatsService.ensureStatsRow();
		};

	}

}
