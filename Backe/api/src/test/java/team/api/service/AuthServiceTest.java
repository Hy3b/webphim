package team.api.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import team.api.dto.request.LoginRequest;
import team.api.dto.request.RegisterRequest;
import team.api.dto.response.AuthResponse;
import team.api.entity.User;
import team.api.repository.UserRepository;
import team.api.security.CustomUserDetails;
import team.api.security.JwtUtil;

import java.util.Date;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest validRegisterRequest;
    private LoginRequest validLoginRequest;
    private User existingUser;

    @BeforeEach
    void setUp() {
        validRegisterRequest = RegisterRequest.builder()
                .username("testuser")
                .email("test@example.com")
                .password("password123")
                .fullName("Test User")
                .phoneNumber("0123456789")
                .build();

        validLoginRequest = LoginRequest.builder()
                .username("testuser")
                .password("password123")
                .build();

        existingUser = User.builder()
                .userId(1)
                .username("testuser")
                .email("test@example.com")
                .passwordHash("$2a$10$encodedHash")
                .fullName("Test User")
                .role(User.Role.customer)
                .build();
    }

    // ==================== REGISTER TESTS ====================

    @Test
    @DisplayName("Register - Thanh cong voi du lieu hop le")
    void register_success() {
        // Arrange
        when(userRepository.existsByUsername("testuser")).thenReturn(false);
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("$2a$10$encodedHash");
        when(userRepository.save(any(User.class))).thenReturn(existingUser);

        // Act
        String result = authService.register(validRegisterRequest);

        // Assert
        assertEquals("User registered successfully!", result);
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Register - That bai khi username da ton tai")
    void register_duplicateUsername_throwsException() {
        // Arrange
        when(userRepository.existsByUsername("testuser")).thenReturn(true);

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> authService.register(validRegisterRequest));
        assertEquals("Error: Username is already taken!", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Register - That bai khi email da ton tai")
    void register_duplicateEmail_throwsException() {
        // Arrange
        when(userRepository.existsByUsername("testuser")).thenReturn(false);
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> authService.register(validRegisterRequest));
        assertEquals("Error: Email is already in use!", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Register - Mat khau duoc ma hoa BCrypt")
    void register_passwordIsEncoded() {
        // Arrange
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("$2a$10$encodedHash");
        when(userRepository.save(any(User.class))).thenReturn(existingUser);

        // Act
        authService.register(validRegisterRequest);

        // Assert
        verify(passwordEncoder).encode("password123");
        verify(userRepository).save(argThat(user ->
                "$2a$10$encodedHash".equals(user.getPasswordHash())));
    }

    @Test
    @DisplayName("Register - Role mac dinh la customer")
    void register_defaultRoleIsCustomer() {
        // Arrange
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenReturn(existingUser);

        // Act
        authService.register(validRegisterRequest);

        // Assert
        verify(userRepository).save(argThat(user ->
                User.Role.customer == user.getRole()));
    }

    // ==================== LOGIN TESTS ====================

    @Test
    @DisplayName("Login - Thanh cong voi thong tin dung")
    void login_success() {
        // Arrange
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(new UsernamePasswordAuthenticationToken("testuser", "password123"));
        when(userRepository.findByUsernameOrEmail("testuser", "testuser"))
                .thenReturn(Optional.of(existingUser));
        when(jwtUtil.generateToken(any(CustomUserDetails.class))).thenReturn("jwt-token-123");
        when(jwtUtil.getExpirationDate("jwt-token-123"))
                .thenReturn(new Date(System.currentTimeMillis() + 86400000));

        // Act
        AuthResponse response = authService.login(validLoginRequest);

        // Assert
        assertNotNull(response);
        assertNotNull(response.getAccessToken());
    }

    @Test
    @DisplayName("Login - That bai khi sai mat khau")
    void login_wrongPassword_throwsException() {
        // Arrange
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        // Act & Assert
        assertThrows(BadCredentialsException.class,
                () -> authService.login(validLoginRequest));
    }

    @Test
    @DisplayName("Login - That bai khi user khong ton tai")
    void login_userNotFound_throwsException() {
        // Arrange
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(new UsernamePasswordAuthenticationToken("testuser", "password123"));
        when(userRepository.findByUsernameOrEmail("testuser", "testuser"))
                .thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> authService.login(validLoginRequest));
        assertEquals("Error: User not found.", exception.getMessage());
    }

    @Test
    @DisplayName("Login - Response chua accessToken")
    void login_responseContainsAccessToken() {
        // Arrange
        when(authenticationManager.authenticate(any())).thenReturn(null);
        when(userRepository.findByUsernameOrEmail("testuser", "testuser"))
                .thenReturn(Optional.of(existingUser));
        when(jwtUtil.generateToken(any(CustomUserDetails.class))).thenReturn("my-jwt-token");
        when(jwtUtil.getExpirationDate("my-jwt-token"))
                .thenReturn(new Date(System.currentTimeMillis() + 86400000));

        // Act
        AuthResponse response = authService.login(validLoginRequest);

        // Assert
        assertEquals("my-jwt-token", response.getAccessToken());
    }

    @Test
    @DisplayName("Login - Response co tokenType la Bearer")
    void login_responseContainsBearerTokenType() {
        // Arrange
        when(authenticationManager.authenticate(any())).thenReturn(null);
        when(userRepository.findByUsernameOrEmail("testuser", "testuser"))
                .thenReturn(Optional.of(existingUser));
        when(jwtUtil.generateToken(any(CustomUserDetails.class))).thenReturn("token");
        when(jwtUtil.getExpirationDate("token"))
                .thenReturn(new Date(System.currentTimeMillis() + 86400000));

        // Act
        AuthResponse response = authService.login(validLoginRequest);

        // Assert
        assertEquals("Bearer", response.getTokenType());
    }
}
