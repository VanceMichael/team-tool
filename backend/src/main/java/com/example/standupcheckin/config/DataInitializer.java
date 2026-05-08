package com.example.standupcheckin.config;

import com.example.standupcheckin.entity.Team;
import com.example.standupcheckin.entity.TeamMember;
import com.example.standupcheckin.entity.User;
import com.example.standupcheckin.mapper.TeamMapper;
import com.example.standupcheckin.mapper.TeamMemberMapper;
import com.example.standupcheckin.mapper.UserMapper;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserMapper userMapper;
    private final TeamMapper teamMapper;
    private final TeamMemberMapper teamMemberMapper;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserMapper userMapper, 
                         TeamMapper teamMapper, 
                         TeamMemberMapper teamMemberMapper,
                         PasswordEncoder passwordEncoder) {
        this.userMapper = userMapper;
        this.teamMapper = teamMapper;
        this.teamMemberMapper = teamMemberMapper;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userMapper.selectCount(null) == 0) {
            initData();
        }
    }

    private void initData() {
        String password = passwordEncoder.encode("123456");

        User admin = createUser("admin", password, "管理员", "ADMIN");
        User leader = createUser("leader", password, "组长张三", "LEADER");
        User member1 = createUser("member1", password, "李四", "MEMBER");
        User member2 = createUser("member2", password, "王五", "MEMBER");

        Team team = new Team();
        team.setName("前端开发组");
        team.setLeaderId(leader.getId());
        teamMapper.insert(team);

        addTeamMember(team.getId(), leader.getId());
        addTeamMember(team.getId(), member1.getId());
        addTeamMember(team.getId(), member2.getId());
    }

    private User createUser(String username, String password, String nickname, String role) {
        User user = new User();
        user.setUsername(username);
        user.setPassword(password);
        user.setNickname(nickname);
        user.setRole(role);
        userMapper.insert(user);
        return user;
    }

    private void addTeamMember(Long teamId, Long userId) {
        TeamMember member = new TeamMember();
        member.setTeamId(teamId);
        member.setUserId(userId);
        teamMemberMapper.insert(member);
    }
}
