package com.ssafy.baperang.domain.leftover.service;

public interface LeftoverService {
    Object getLeftoversByDate(String dateStr);

    Object getLeftoversByMonth(int year, int month);
}
