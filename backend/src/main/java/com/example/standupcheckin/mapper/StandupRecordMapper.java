package com.example.standupcheckin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.standupcheckin.entity.StandupRecord;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface StandupRecordMapper extends BaseMapper<StandupRecord> {
}
