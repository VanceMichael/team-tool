package com.example.standupcheckin.controller;

import com.example.standupcheckin.common.Result;
import com.example.standupcheckin.dto.LoginResponse;
import com.example.standupcheckin.entity.Team;
import com.example.standupcheckin.entity.User;
import com.example.standupcheckin.service.TeamService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teams")
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    @PostMapping
    public Result<Team> createTeam(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> request) {
        return Result.success(teamService.createTeam(request.get("name"), user.getId()));
    }

    @GetMapping("/my")
    public Result<List<Team>> getMyTeams(@AuthenticationPrincipal User user) {
        return Result.success(teamService.getMyTeams(user.getId()));
    }

    @GetMapping("/{teamId}/members")
    public Result<List<LoginResponse.UserDTO>> getTeamMembers(@PathVariable Long teamId) {
        return Result.success(teamService.getTeamMembers(teamId));
    }

    @PostMapping("/{teamId}/members")
    public Result<Void> addMember(
            @AuthenticationPrincipal User user,
            @PathVariable Long teamId,
            @RequestBody Map<String, Long> request) {
        teamService.addMember(teamId, request.get("userId"), user.getId(), user.getRole());
        return Result.success();
    }

    @DeleteMapping("/{teamId}/members/{userId}")
    public Result<Void> removeMember(
            @AuthenticationPrincipal User user,
            @PathVariable Long teamId,
            @PathVariable Long userId) {
        teamService.removeMember(teamId, userId, user.getId(), user.getRole());
        return Result.success();
    }

    @GetMapping("/users")
    public Result<List<LoginResponse.UserDTO>> getAllUsers() {
        return Result.success(teamService.getAllUsers());
    }
}
