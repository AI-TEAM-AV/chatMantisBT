package com.americavirtual.chatMantisBT.configuration;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.repository.configuration.EnableRedisRepositories;

@Configuration
@EnableRedisRepositories(basePackages = "com.americavirtual.chatMantisBT.repository")
public class RedisConfig {
}
