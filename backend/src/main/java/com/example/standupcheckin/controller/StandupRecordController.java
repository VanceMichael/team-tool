package com.example.standupcheckin.controller;

import com.example.standupcheckin.common.Result;
import com.example.standupcheckin.dto.StandupRecordRequest;
import com.example.standupcheckin.entity.StandupRecord;
import com.example.standupcheckin.entity.User;
import com.example.standupcheckin.service.StandupRecordService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/standup")
public class StandupRecordController {

    private final StandupRecordService standupRecordService;

    public StandupRecordController(StandupRecordService standupRecordService) {
        this.standupRecordService = standupRecordService;
    }

    @PostMapping
    public Result<StandupRecord> createOrUpdateRecord(
            @AuthenticationPrincipal User user,
            @RequestBody StandupRecordRequest request) {
        return Result.success(standupRecordService.createOrUpdateRecord(
                user.getId(),
                user.getRole(),
                request
        ));
    }

    @PutMapping("/{recordId}")
    public Result<StandupRecord> updateRecord(
            @AuthenticationPrincipal User user,
            @PathVariable Long recordId,
            @RequestBody StandupRecordRequest request) {
        return Result.success(standupRecordService.updateRecord(
                recordId,
                user.getId(),
                user.getRole(),
                request
        ));
    }

    @GetMapping("/day/{teamId}")
    public Result<Map<String, Object>> getDayRecords(
            @AuthenticationPrincipal User user,
            @PathVariable Long teamId,
            @RequestParam(required = false) String date) {
        LocalDate recordDate = date != null ? LocalDate.parse(date) : LocalDate.now();
        return Result.success(standupRecordService.getDayRecords(
                teamId,
                recordDate,
                user.getId(),
                user.getRole()
        ));
    }

    @GetMapping("/calendar/{teamId}")
    public Result<List<Map<String, Object>>> getCalendarView(
            @AuthenticationPrincipal User user,
            @PathVariable Long teamId) {
        return Result.success(standupRecordService.getCalendarView(teamId, user.getId()));
    }
}
