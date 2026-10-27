package com.java.vinod.authorization.server.security;

import com.java.vinod.authorization.server.entity.AppUser;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;

public record AuthenticatedUser(
        Long id,
        String publicId,
        String email,
        String password,
        boolean enabled,
        Collection<? extends GrantedAuthority> authorities
) implements UserDetails {

    public static AuthenticatedUser from(AppUser user,
                                         String password,
                                         Collection<? extends GrantedAuthority> authorities,
                                         boolean enabled) {
        return new AuthenticatedUser(user.getId(), user.getPublicId(), user.getEmail(), password, enabled, authorities);
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return enabled;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}
