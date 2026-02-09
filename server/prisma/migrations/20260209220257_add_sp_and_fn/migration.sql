-- Stored procedure: returns investors with investment >= p_amount (default 15000)
CREATE PROCEDURE sp_inversionistas_mayor(IN p_amount DOUBLE)
SELECT * FROM Investor WHERE investment >= IFNULL(p_amount, 15000);

-- Stored function: returns 'active' if id is even, 'inactive' if odd
CREATE FUNCTION fn_estado_inversionista(p_id INT) RETURNS VARCHAR(20)
DETERMINISTIC
READS SQL DATA
RETURN IF(p_id % 2 = 0, 'active', 'inactive');
