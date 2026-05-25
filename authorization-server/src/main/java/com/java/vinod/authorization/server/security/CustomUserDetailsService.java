package com.java.vinod.authorization.server.security;

import com.java.vinod.authorization.server.entity.AppUser;
import com.java.vinod.authorization.server.entity.UserCredential;
import com.java.vinod.authorization.server.enums.UserStatus;
import com.java.vinod.authorization.server.repository.AppUserRepository;
import com.java.vinod.authorization.server.repository.UserCredentialRepository;
import com.java.vinod.authorization.server.repository.UserRoleRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class CustomUserDetailsService implements UserDetailsService {
    private final AppUserRepository appUserRepository;
    private final UserCredentialRepository userCredentialRepository;
    private final UserRoleRepository userRoleRepository;

    public CustomUserDetailsService(AppUserRepository appUserRepository,
                                    UserCredentialRepository userCredentialRepository,
                                    UserRoleRepository userRoleRepository) {
        this.appUserRepository = appUserRepository;
        this.userCredentialRepository = userCredentialRepository;
        this.userRoleRepository = userRoleRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) {
        String normalizedEmail = username.trim().toLowerCase();
        AppUser user = appUserRepository.findByNormalizedEmail(normalizedEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Invalid credentials"));
        UserCredential credential = userCredentialRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new UsernameNotFoundException("Invalid credentials"));
        var authorities = userRoleRepository.findByUser_Id(user.getId()).stream()
                .map(userRole -> new SimpleGrantedAuthority("ROLE_" + userRole.getRole().getRoleName()))
                .toList();
        boolean enabled = user.getStatus() == UserStatus.ACTIVE
                && (user.getLockedUntil() == null || user.getLockedUntil().isBefore(LocalDateTime.now()));
        return AuthenticatedUser.from(user, credential.getPasswordHash(), authorities, enabled);
    }
}
