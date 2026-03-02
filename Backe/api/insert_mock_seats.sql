USE Cinema_DB;
DELETE FROM seats WHERE room_id = 1;

-- Thêm ghế A-H (1-14)
DELIMITER $$
CREATE PROCEDURE InsertSeats()
BEGIN
    DECLARE v_row CHAR(1);
    DECLARE v_col INT;
    DECLARE v_type INT;
    DECLARE ascii_val INT DEFAULT 65; -- 'A'

    WHILE ascii_val <= 72 DO -- 'H'
        SET v_row = CHAR(ascii_val);
        SET v_col = 1;
        
        WHILE v_col <= 14 DO
            -- Giả sử A, B là Normal (1), C-G là VIP (2), H là Couple (3)
            IF ascii_val <= 66 THEN SET v_type = 1;
            ELSEIF ascii_val <= 71 THEN SET v_type = 2;
            ELSE SET v_type = 3;
            END IF;
            
            INSERT INTO seats (room_id, seat_type_id, row_name, seat_number) 
            VALUES (1, v_type, v_row, v_col);
            
            SET v_col = v_col + 1;
        END WHILE;
        
        SET ascii_val = ascii_val + 1;
    END WHILE;
END$$
DELIMITER ;

CALL InsertSeats();
DROP PROCEDURE InsertSeats;
UPDATE rooms SET total_seats = (SELECT COUNT(*) FROM seats WHERE room_id = 1) WHERE room_id = 1;
