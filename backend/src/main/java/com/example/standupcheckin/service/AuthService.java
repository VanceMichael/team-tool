package com.example.standupcheckin.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.standupcheckin.common.BusinessException;
import com.example.standupcheckin.dto.LoginRequest;
import com.example.standupcheckin.dto.LoginResponse;
import com.example.standupcheckin.dto.RegisterRequest;
import com.example.standupcheckin.entity.User;
import com.example.standupcheckin.mapper.UserMapper;
import com.example.standupcheckin.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserMapper userMapper, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        User user = userMapper.selectOne(
            new LambdaQueryWrapper<User>()
                .eq(User::getUsername, request.getUsername())
        );

        if (user == null) {
            throw new BusinessException("用户名或密码错误");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException("用户名或密码错误");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getRole());

        LoginResponse response = new LoginResponse();
        response.setToken(token);
        
        LoginResponse.UserDTO userDTO = new LoginResponse.UserDTO();
        userDTO.setId(user.getId());
        userDTO.setUsername(user.getUsername());
        userDTO.setNickname(user.getNickname());
        userDTO.setAvatar(user.getAvatar());
        userDTO.setRole(user.getRole());
        response.setUser(userDTO);

        return response;
    }

    @Transactional
    public LoginResponse register(RegisterRequest request) {
        User exist = userMapper.selectOne(
            new LambdaQueryWrapper<User>()
                .eq(User::getUsername, request.getUsername())
        );

        if (exist != null) {
            throw new BusinessException("用户名已存在");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setNickname(request.getNickname() != null ? request.getNickname() : request.getUsername());
        user.setRole("MEMBER");

        userMapper.insert(user);

        String token = jwtUtil.generateToken(user.getId(), user.getRole());

        LoginResponse response = new LoginResponse();
        response.setToken(token);
        
        LoginResponse.UserDTO userDTO = new LoginResponse.UserDTO();
        userDTO.setId(user.getId());
        userDTO.setUsername(user.getUsername());
        userDTO.setNickname(user.getNickname());
        userDTO.setAvatar(user.getAvatar());
        userDTO.setRole(user.getRole());
        response.setUser(userDTO);

        return response;
    }

    public LoginResponse.UserDTO getCurrentUser(User currentUser) {
        LoginResponse.UserDTO userDTO = new LoginResponse.UserDTO();
        userDTO.setId(currentUser.getId());
        userDTO.setUsername(currentUser.getUsername());
        userDTO.setNickname(currentUser.getNickname());
        userDTO.setAvatar(currentUser.getAvatar());
        userDTO.setRole(currentUser.getRole());
        return userDTO;
    }
}
