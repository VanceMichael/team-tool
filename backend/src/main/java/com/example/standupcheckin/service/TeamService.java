package com.example.standupcheckin.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.standupcheckin.common.BusinessException;
import com.example.standupcheckin.dto.LoginResponse;
import com.example.standupcheckin.entity.Team;
import com.example.standupcheckin.entity.TeamMember;
import com.example.standupcheckin.entity.User;
import com.example.standupcheckin.mapper.TeamMapper;
import com.example.standupcheckin.mapper.TeamMemberMapper;
import com.example.standupcheckin.mapper.UserMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TeamService {

    private final TeamMapper teamMapper;
    private final TeamMemberMapper teamMemberMapper;
    private final UserMapper userMapper;

    public TeamService(TeamMapper teamMapper, TeamMemberMapper teamMemberMapper, UserMapper userMapper) {
        this.teamMapper = teamMapper;
        this.teamMemberMapper = teamMemberMapper;
        this.userMapper = userMapper;
    }

    @Transactional
    public Team createTeam(String name, Long leaderId) {
        Team team = new Team();
        team.setName(name);
        team.setLeaderId(leaderId);
        teamMapper.insert(team);

        TeamMember teamMember = new TeamMember();
        teamMember.setTeamId(team.getId());
        teamMember.setUserId(leaderId);
        teamMemberMapper.insert(teamMember);

        return team;
    }

    public List<Team> getMyTeams(Long userId) {
        List<TeamMember> teamMembers = teamMemberMapper.selectList(
            new LambdaQueryWrapper<TeamMember>()
                .eq(TeamMember::getUserId, userId)
        );

        if (teamMembers.isEmpty()) {
            return new ArrayList<>();
        }

        List<Long> teamIds = teamMembers.stream()
            .map(TeamMember::getTeamId)
            .collect(Collectors.toList());

        return teamMapper.selectList(
            new LambdaQueryWrapper<Team>()
                .in(Team::getId, teamIds)
        );
    }

    public List<LoginResponse.UserDTO> getTeamMembers(Long teamId) {
        List<TeamMember> teamMembers = teamMemberMapper.selectList(
            new LambdaQueryWrapper<TeamMember>()
                .eq(TeamMember::getTeamId, teamId)
        );

        if (teamMembers.isEmpty()) {
            return new ArrayList<>();
        }

        List<Long> userIds = teamMembers.stream()
            .map(TeamMember::getUserId)
            .collect(Collectors.toList());

        List<User> users = userMapper.selectList(
            new LambdaQueryWrapper<User>()
                .in(User::getId, userIds)
        );

        return users.stream().map(user -> {
            LoginResponse.UserDTO dto = new LoginResponse.UserDTO();
            dto.setId(user.getId());
            dto.setUsername(user.getUsername());
            dto.setNickname(user.getNickname());
            dto.setAvatar(user.getAvatar());
            dto.setRole(user.getRole());
            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional
    public void addMember(Long teamId, Long userId, Long currentUserId, String currentUserRole) {
        Team team = teamMapper.selectById(teamId);
        if (team == null) {
            throw new BusinessException("组不存在");
        }

        if (!"ADMIN".equals(currentUserRole) && !team.getLeaderId().equals(currentUserId)) {
            throw new BusinessException(403, "无权限");
        }

        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }

        TeamMember exist = teamMemberMapper.selectOne(
            new LambdaQueryWrapper<TeamMember>()
                .eq(TeamMember::getTeamId, teamId)
                .eq(TeamMember::getUserId, userId)
        );

        if (exist != null) {
            throw new BusinessException("用户已在该组中");
        }

        TeamMember teamMember = new TeamMember();
        teamMember.setTeamId(teamId);
        teamMember.setUserId(userId);
        teamMemberMapper.insert(teamMember);
    }

    @Transactional
    public void removeMember(Long teamId, Long userId, Long currentUserId, String currentUserRole) {
        Team team = teamMapper.selectById(teamId);
        if (team == null) {
            throw new BusinessException("组不存在");
        }

        if (!"ADMIN".equals(currentUserRole) && !team.getLeaderId().equals(currentUserId)) {
            throw new BusinessException(403, "无权限");
        }

        if (team.getLeaderId().equals(userId)) {
            throw new BusinessException("不能移除组长");
        }

        teamMemberMapper.delete(
            new LambdaQueryWrapper<TeamMember>()
                .eq(TeamMember::getTeamId, teamId)
                .eq(TeamMember::getUserId, userId)
        );
    }

    public List<LoginResponse.UserDTO> getAllUsers() {
        List<User> users = userMapper.selectList(
            new LambdaQueryWrapper<User>()
                .orderByDesc(User::getCreatedAt)
        );

        return users.stream().map(user -> {
            LoginResponse.UserDTO dto = new LoginResponse.UserDTO();
            dto.setId(user.getId());
            dto.setUsername(user.getUsername());
            dto.setNickname(user.getNickname());
            dto.setAvatar(user.getAvatar());
            dto.setRole(user.getRole());
            return dto;
        }).collect(Collectors.toList());
    }
}
