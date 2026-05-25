package com.java.vinod.authorization.server.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
@Embeddable
public class UserApplicationAccessId implements Serializable {

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "application_id")
    private Long applicationId;
}
