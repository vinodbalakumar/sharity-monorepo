package com.java.vinod.authorization.server.service;

import com.java.vinod.authorization.server.entity.AppUser;
import com.java.vinod.authorization.server.entity.AuditLog;
import com.java.vinod.authorization.server.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AuditService {
    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void record(AppUser actor, AppUser target, String action, String entityType, String entityId, String ipAddress) {
        AuditLog log = new AuditLog();
        log.setActorUser(actor);
        log.setTargetUser(target);
        log.setAction(action);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setIpAddress(ipAddress);
        log.setCreatedAt(LocalDateTime.now());
        auditLogRepository.save(log);
    }
}
