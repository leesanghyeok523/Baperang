package com.ssafy.baperang.domain.satisfaction.controller;

import com.ssafy.baperang.domain.satisfaction.dto.SatisfactionRequestDto;
import com.ssafy.baperang.domain.satisfaction.dto.SatisfactionResponseDto;
import com.ssafy.baperang.domain.satisfaction.service.SatisfactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/satisfaction")
@RequiredArgsConstructor
public class SatisfactionController {

    private final SatisfactionService satisfactionService;

    @PostMapping
    public ResponseEntity<Void> submitSatisfaction(@RequestBody SatisfactionRequestDto request) {
        satisfactionService.saveSatisfaction(request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping("/recent")
    public ResponseEntity<List<SatisfactionResponseDto>> getRecentSatisfactions() {
        return ResponseEntity.ok(satisfactionService.getRecentSatisfactions());
    }

    @GetMapping(value = "/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe() {
        return satisfactionService.subscribe();
    }
} 