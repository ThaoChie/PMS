package com.pms.backend.security;

import com.pms.backend.enu.RoleSystem;
import com.pms.backend.enu.UserStatus;
import com.pms.backend.model.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public class AuthUserPrincipal implements UserDetails {

    private final Long id;
    private final String email;
    private final String password;
    private final RoleSystem systemRole;
    private final boolean enabled;
    private final Collection<? extends GrantedAuthority> authorities;

    public AuthUserPrincipal(Long id, String email, String password, RoleSystem systemRole, boolean enabled, Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.systemRole = systemRole;
        this.enabled = enabled;
        this.authorities = authorities;
    }

    public static AuthUserPrincipal create(User user) {
        RoleSystem role = user.getSystemRole() != null ? user.getSystemRole() : RoleSystem.MEMBER;
        List<GrantedAuthority> authorities = List.of(
                new SimpleGrantedAuthority("ROLE_" + role.name()),
                new SimpleGrantedAuthority(role.name())
        );

        return new AuthUserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getPassword() != null ? user.getPassword() : "",
                role,
                user.getStatus() != UserStatus.LOCKED,
                authorities
        );
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public RoleSystem getSystemRole() { return systemRole; }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }

    @Override
    public String getPassword() { return password; }

    @Override
    public String getUsername() { return email; }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return enabled; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return enabled; }
}
