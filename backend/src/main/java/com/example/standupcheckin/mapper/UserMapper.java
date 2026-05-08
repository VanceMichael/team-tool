package com.example.standupcheckin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.standupcheckin.entity.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper extends BaseMapper<User> {
}
