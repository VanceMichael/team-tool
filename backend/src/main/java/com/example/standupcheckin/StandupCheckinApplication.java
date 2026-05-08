package com.example.standupcheckin;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.example.standupcheckin.mapper")
public class StandupCheckinApplication {
    public static void main(String[] args) {
        SpringApplication.run(StandupCheckinApplication.class, args);
    }
}
