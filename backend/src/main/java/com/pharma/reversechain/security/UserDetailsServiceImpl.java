package com.pharma.reversechain.security;

import com.pharma.reversechain.entity.User;
import com.pharma.reversechain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByEmailWithOrganization(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + username));
        // Initialize the organization association
        if (user.getOrganization() != null) {
            user.getOrganization().getName(); // trigger lazy init
        }
        return UserDetailsImpl.build(user);
    }
}
