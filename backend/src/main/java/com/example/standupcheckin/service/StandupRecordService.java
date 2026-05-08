package com.example.standupcheckin.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.standupcheckin.common.BusinessException;
import com.example.standupcheckin.dto.LoginResponse;
import com.example.standupcheckin.dto.StandupRecordRequest;
import com.example.standupcheckin.entity.StandupRecord;
import com.example.standupcheckin.entity.Team;
import com.example.standupcheckin.entity.TeamMember;
import com.example.standupcheckin.mapper.StandupRecordMapper;
import com.example.standupcheckin.mapper.TeamMapper;
import com.example.standupcheckin.mapper.TeamMemberMapper;
import com.example.standupcheckin.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StandupRecordService {

    private final StandupRecordMapper standupRecordMapper;
    private final TeamMapper teamMapper;
    private final TeamMemberMapper teamMemberMapper;
    private final UserMapper userMapper;

    @Value("${app.edit-window-minutes}")
    private int editWindowMinutes;

    public StandupRecordService(StandupRecordMapper standupRecordMapper,
                              TeamMapper teamMapper,
                              TeamMemberMapper teamMemberMapper,
                              UserMapper userMapper) {
        this.standupRecordMapper = standupRecordMapper;
        this.teamMapper = teamMapper;
        this.teamMemberMapper = teamMemberMapper;
        this.userMapper = userMapper;
    }

    @Transactional
    public StandupRecord createOrUpdateRecord(Long userId, String userRole, StandupRecordRequest request) {
        checkTeamMembership(userId, request.getTeamId());

        LocalDate today = LocalDate.now();

        StandupRecord existing = standupRecordMapper.selectOne(
            new LambdaQueryWrapper<StandupRecord>()
                .eq(StandupRecord::getUserId, userId)
                .eq(StandupRecord::getRecordDate, today)
        );

        if (existing != null) {
            return updateRecord(existing.getId(), userId, userRole, request);
        }

        StandupRecord record = new StandupRecord();
        record.setUserId(userId);
        record.setTeamId(request.getTeamId());
        record.setRecordDate(today);
        record.setYesterday(request.getYesterday());
        record.setToday(request.getToday());
        record.setBlocker(request.getBlocker());

        standupRecordMapper.insert(record);
        return record;
    }

    @Transactional
    public StandupRecord updateRecord(Long recordId, Long userId, String userRole, StandupRecordRequest request) {
        StandupRecord record = standupRecordMapper.selectById(recordId);
        if (record == null) {
            throw new BusinessException("记录不存在");
        }

        if (!"ADMIN".equals(userRole)) {
            if (!record.getUserId().equals(userId)) {
                throw new BusinessException(403, "无权限");
            }

            long minutesSinceCreation = Duration.between(record.getCreatedAt(), LocalDateTime.now()).toMinutes();
            if (minutesSinceCreation > editWindowMinutes) {
                throw new BusinessException("已超过编辑时间窗口，无法编辑");
            }
        }

        if (request.getTeamId() != null) {
            checkTeamMembership(userId, request.getTeamId());
            record.setTeamId(request.getTeamId());
        }

        if (request.getYesterday() != null) {
            record.setYesterday(request.getYesterday());
        }
        if (request.getToday() != null) {
            record.setToday(request.getToday());
        }
        if (request.getBlocker() != null) {
            record.setBlocker(request.getBlocker());
        }

        standupRecordMapper.updateById(record);
        return record;
    }

    public Map<String, Object> getDayRecords(Long teamId, LocalDate date, Long currentUserId, String currentUserRole) {
        checkTeamMembership(currentUserId, teamId);

        List<TeamMember> members = teamMemberMapper.selectList(
            new LambdaQueryWrapper<TeamMember>()
                .eq(TeamMember::getTeamId, teamId)
        );

        List<Long> userIds = members.stream()
            .map(TeamMember::getUserId)
            .collect(Collectors.toList());

        List<LoginResponse.UserDTO> membersDTO = userMapper.selectBatchIds(userIds).stream().map(user -> {
            LoginResponse.UserDTO dto = new LoginResponse.UserDTO();
            dto.setId(user.getId());
            dto.setUsername(user.getUsername());
            dto.setNickname(user.getNickname());
            dto.setAvatar(user.getAvatar());
            dto.setRole(user.getRole());
            return dto;
        }).collect(Collectors.toList());

        List<StandupRecord> records = standupRecordMapper.selectList(
            new LambdaQueryWrapper<StandupRecord>()
                .eq(StandupRecord::getTeamId, teamId)
                .eq(StandupRecord::getRecordDate, date)
        );

        Map<Long, StandupRecord> recordMap = records.stream()
            .collect(Collectors.toMap(StandupRecord::getUserId, r -> r));

        List<Map<String, Object>> result = new ArrayList<>();
        for (LoginResponse.UserDTO member : membersDTO) {
            Map<String, Object> item = new HashMap<>();
            item.put("user", member);

            StandupRecord record = recordMap.get(member.getId());
            item.put("hasRecord", record != null);

            if (record != null) {
                item.put("record", record);

                boolean canEdit = "ADMIN".equals(currentUserRole);
                if (!canEdit && record.getUserId().equals(currentUserId)) {
                    long minutesSinceCreation = Duration.between(record.getCreatedAt(), LocalDateTime.now()).toMinutes();
                    canEdit = minutesSinceCreation <= editWindowMinutes;
                }
                item.put("canEdit", canEdit);
            } else {
                item.put("canEdit", member.getId().equals(currentUserId));
            }

            result.add(item);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("date", date);
        response.put("members", result);
        return response;
    }

    public List<Map<String, Object>> getCalendarView(Long teamId, Long currentUserId) {
        checkTeamMembership(currentUserId, teamId);

        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(14);

        List<StandupRecord> records = standupRecordMapper.selectList(
            new LambdaQueryWrapper<StandupRecord>()
                .eq(StandupRecord::getTeamId, teamId)
                .ge(StandupRecord::getRecordDate, startDate)
                .le(StandupRecord::getRecordDate, today)
        );

        List<TeamMember> members = teamMemberMapper.selectList(
            new LambdaQueryWrapper<TeamMember>()
                .eq(TeamMember::getTeamId, teamId)
        );

        int totalMembers = members.size();

        Map<LocalDate, List<StandupRecord>> recordsByDate = records.stream()
            .collect(Collectors.groupingBy(StandupRecord::getRecordDate));

        List<Map<String, Object>> calendar = new ArrayList<>();
        for (int i = 14; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            List<StandupRecord> dayRecords = recordsByDate.getOrDefault(date, new ArrayList<>());

            Map<String, Object> dayInfo = new HashMap<>();
            dayInfo.put("date", date);
            dayInfo.put("submittedCount", dayRecords.size());
            dayInfo.put("totalMembers", totalMembers);
            dayInfo.put("allSubmitted", dayRecords.size() > 0 && dayRecords.size() == totalMembers);
            calendar.add(dayInfo);
        }

        return calendar;
    }

    private void checkTeamMembership(Long userId, Long teamId) {
        Team team = teamMapper.selectById(teamId);
        if (team == null) {
            throw new BusinessException("组不存在");
        }

        TeamMember membership = teamMemberMapper.selectOne(
            new LambdaQueryWrapper<TeamMember>()
                .eq(TeamMember::getTeamId, teamId)
                .eq(TeamMember::getUserId, userId)
        );

        if (membership == null) {
            throw new BusinessException(403, "无权限");
        }
    }
}
