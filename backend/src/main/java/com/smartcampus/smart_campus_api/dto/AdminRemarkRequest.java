package com.smartcampus.smart_campus_api.dto;

/**
 * DTO for admin approve/reject actions with remarks.
 *
 * @author Member 2 (M2)
 */
public class AdminRemarkRequest {

    private String remarks;

    public AdminRemarkRequest() {}

    public AdminRemarkRequest(String remarks) {
        this.remarks = remarks;
    }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
