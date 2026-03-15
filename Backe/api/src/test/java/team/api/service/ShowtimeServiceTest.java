package team.api.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.redisson.api.RMap;
import org.redisson.api.RedissonClient;
import team.api.dto.response.SeatStatusResponse;
import team.api.dto.response.ShowtimeDetailResponse;
import team.api.entity.*;
import team.api.repository.SeatRepository;
import team.api.repository.ShowtimeRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShowtimeServiceTest {

    @Mock
    private ShowtimeRepository showtimeRepository;

    @Mock
    private SeatRepository seatRepository;

    @Mock
    private RedissonClient redissonClient;

    @Mock
    private RMap<String, String> seatStatusMap;

    @InjectMocks
    private ShowtimeService showtimeService;

    private Movie movie;
    private Room room;
    private Showtime showtime;
    private SeatType seatType;
    private Seat seat1;
    private Seat seat2;

    @BeforeEach
    void setUp() {
        movie = Movie.builder()
                .id(1L)
                .name("Avengers: Endgame")
                .plot("Epic finale")
                .duration(181)
                .poster("poster.jpg")
                .genre("Action")
                .ageRating("C13")
                .build();

        room = Room.builder()
                .roomId(1)
                .name("Room 1")
                .totalSeats(100)
                .build();

        showtime = Showtime.builder()
                .showtimeId(1)
                .movie(movie)
                .room(room)
                .startTime(LocalDateTime.of(2026, 3, 15, 19, 0))
                .basePrice(new BigDecimal("75000"))
                .status(Showtime.Status.active)
                .build();

        seatType = SeatType.builder()
                .seatTypeId(1)
                .name("Standard")
                .surcharge(new BigDecimal("0"))
                .build();

        seat1 = Seat.builder()
                .seatId(1)
                .room(room)
                .seatType(seatType)
                .rowName("A")
                .seatNumber(1)
                .build();

        seat2 = Seat.builder()
                .seatId(2)
                .room(room)
                .seatType(seatType)
                .rowName("A")
                .seatNumber(2)
                .build();
    }

    // ==================== GET SEAT STATUSES ====================

    @Test
    @DisplayName("getSeatStatuses - Tra ve trang thai dung (AVAILABLE, LOCKED, SOLD)")
    void getSeatStatuses_returnsCorrectStatuses() {
        // Arrange
        when(showtimeRepository.findById(1)).thenReturn(Optional.of(showtime));
        when(seatRepository.findByRoomIdWithSeatType(1)).thenReturn(List.of(seat1, seat2));
        when(redissonClient.<String, String>getMap("showtime:1:seats")).thenReturn(seatStatusMap);
        when(seatStatusMap.getOrDefault("A1", "AVAILABLE")).thenReturn("LOCKED");
        when(seatStatusMap.getOrDefault("A2", "AVAILABLE")).thenReturn("AVAILABLE");

        // Act
        List<SeatStatusResponse> result = showtimeService.getSeatStatuses(1);

        // Assert
        assertEquals(2, result.size());
        assertEquals("LOCKED", result.get(0).getStatus());
        assertEquals("AVAILABLE", result.get(1).getStatus());
    }

    @Test
    @DisplayName("getSeatStatuses - Showtime khong ton tai thi throw exception")
    void getSeatStatuses_showtimeNotFound_throwsException() {
        // Arrange
        when(showtimeRepository.findById(999)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> showtimeService.getSeatStatuses(999));
        assertEquals("Showtime not found", ex.getMessage());
    }

    @Test
    @DisplayName("getSeatStatuses - Khong co du lieu Redis thi tat ca AVAILABLE")
    void getSeatStatuses_noRedisData_allAvailable() {
        // Arrange
        when(showtimeRepository.findById(1)).thenReturn(Optional.of(showtime));
        when(seatRepository.findByRoomIdWithSeatType(1)).thenReturn(List.of(seat1, seat2));
        when(redissonClient.<String, String>getMap("showtime:1:seats")).thenReturn(seatStatusMap);
        when(seatStatusMap.getOrDefault(anyString(), eq("AVAILABLE"))).thenReturn("AVAILABLE");

        // Act
        List<SeatStatusResponse> result = showtimeService.getSeatStatuses(1);

        // Assert
        assertTrue(result.stream().allMatch(s -> "AVAILABLE".equals(s.getStatus())));
    }

    // ==================== GET SHOWTIME DETAIL ====================

    @Test
    @DisplayName("getShowtimeDetail - Thanh cong, map dung cac truong")
    void getShowtimeDetail_success() {
        // Arrange
        when(showtimeRepository.findById(1)).thenReturn(Optional.of(showtime));

        // Act
        ShowtimeDetailResponse result = showtimeService.getShowtimeDetail(1);

        // Assert
        assertEquals(1, result.getShowtimeId());
        assertEquals(1L, result.getMovieId());
        assertEquals("Avengers: Endgame", result.getMovieTitle());
        assertEquals("poster.jpg", result.getPoster());
        assertEquals("Room 1", result.getRoomName());
        assertEquals(new BigDecimal("75000"), result.getBasePrice());
        assertEquals(181, result.getDuration());
        assertEquals("Action", result.getGenre());
        assertEquals("C13", result.getAgeRating());
    }

    @Test
    @DisplayName("getShowtimeDetail - Khong tim thay thi throw exception")
    void getShowtimeDetail_notFound_throwsException() {
        // Arrange
        when(showtimeRepository.findById(999)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class,
                () -> showtimeService.getShowtimeDetail(999));
    }

    // ==================== GET SHOWTIMES BY MOVIE ====================

    @Test
    @DisplayName("getShowtimesByMovie - Tra ve danh sach suat chieu theo phim")
    void getShowtimesByMovie_returnsList() {
        // Arrange
        when(showtimeRepository.findByMovie_Id(1L)).thenReturn(List.of(showtime));

        // Act
        List<ShowtimeDetailResponse> result = showtimeService.getShowtimesByMovie(1L);

        // Assert
        assertEquals(1, result.size());
        assertEquals("Avengers: Endgame", result.get(0).getMovieTitle());
    }

    @Test
    @DisplayName("getShowtimesByMovie - Khong co suat chieu thi tra ve list rong")
    void getShowtimesByMovie_noResult_returnsEmptyList() {
        // Arrange
        when(showtimeRepository.findByMovie_Id(999L)).thenReturn(Collections.emptyList());

        // Act
        List<ShowtimeDetailResponse> result = showtimeService.getShowtimesByMovie(999L);

        // Assert
        assertTrue(result.isEmpty());
    }

    // ==================== GET ALL SHOWTIMES ====================

    @Test
    @DisplayName("getAllShowtimes - Tra ve tat ca suat chieu")
    void getAllShowtimes_returnsList() {
        // Arrange
        when(showtimeRepository.findAll()).thenReturn(List.of(showtime));

        // Act
        List<ShowtimeDetailResponse> result = showtimeService.getAllShowtimes();

        // Assert
        assertEquals(1, result.size());
        assertEquals(1, result.get(0).getShowtimeId());
    }
}
