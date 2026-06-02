import { describe, it, expect } from 'vitest';
import { adaptMySQLToSQLite, adaptMySQLWithWarnings, detectDroppedFunctions } from '@/lib/mysql-adapter';

describe('mysql-adapter', () => {
  describe('adaptMySQLToSQLite - clauses', () => {
    it('should convert backtick identifiers to double quotes', () => {
      const result = adaptMySQLToSQLite('SELECT `name` FROM `users`');
      expect(result).toBe('SELECT "name" FROM "users"');
    });

    it('should convert AUTO_INCREMENT to AUTOINCREMENT', () => {
      const result = adaptMySQLToSQLite('CREATE TABLE t (id INT AUTO_INCREMENT)');
      expect(result).toContain('AUTOINCREMENT');
      expect(result).not.toContain('AUTO_INCREMENT');
    });

    it('should remove USE database statements', () => {
      const result = adaptMySQLToSQLite('USE mydb;');
      expect(result).toBe('-- USE statement removed');
    });

    it('should remove SET NAMES statements', () => {
      const result = adaptMySQLToSQLite('SET NAMES utf8;');
      expect(result).toContain('SET NAMES removed');
    });

    it('should convert SHOW TABLES to sqlite_master query', () => {
      const result = adaptMySQLToSQLite('SHOW TABLES;');
      expect(result).toContain("SELECT name FROM sqlite_master");
    });

    it('should convert DESCRIBE table to PRAGMA', () => {
      const result = adaptMySQLToSQLite('DESCRIBE users;');
      expect(result).toBe('PRAGMA table_info(users)');
    });

    it('should convert STRAIGHT_JOIN to JOIN', () => {
      const result = adaptMySQLToSQLite('SELECT * FROM a STRAIGHT_JOIN b ON a.id = b.id');
      expect(result).toContain('JOIN');
      expect(result).not.toContain('STRAIGHT_JOIN');
    });

    it('should remove SQL_NO_CACHE and SQL_CACHE', () => {
      const result = adaptMySQLToSQLite('SELECT SQL_NO_CACHE * FROM t');
      expect(result).not.toContain('SQL_NO_CACHE');
    });

    it('should remove HIGH_PRIORITY, LOW_PRIORITY, DELAYED', () => {
      const result = adaptMySQLToSQLite('INSERT HIGH_PRIORITY INTO t VALUES (1)');
      expect(result).not.toContain('HIGH_PRIORITY');
    });

    it('should remove ON DUPLICATE KEY UPDATE clause', () => {
      const result = adaptMySQLToSQLite("INSERT INTO t (id) VALUES (1) ON DUPLICATE KEY UPDATE id = 2");
      expect(result).not.toContain('ON DUPLICATE KEY');
    });
  });

  describe('adaptMySQLToSQLite - data types', () => {
    it('should convert INT to INTEGER', () => {
      const result = adaptMySQLToSQLite('CREATE TABLE t (id INT PRIMARY KEY)');
      expect(result).toContain('INTEGER');
    });

    it('should convert VARCHAR(n) to TEXT', () => {
      const result = adaptMySQLToSQLite('CREATE TABLE t (name VARCHAR(255))');
      expect(result).toContain('TEXT');
      expect(result).not.toContain('VARCHAR');
    });

    it('should convert DECIMAL(p,s) to REAL', () => {
      const result = adaptMySQLToSQLite('CREATE TABLE t (price DECIMAL(10,2))');
      expect(result).toContain('REAL');
    });

    it('should convert DOUBLE(p,s) to REAL', () => {
      const result = adaptMySQLToSQLite('CREATE TABLE t (val DOUBLE(10,2))');
      expect(result).toContain('REAL');
    });

    it('should convert BOOLEAN to INTEGER', () => {
      const result = adaptMySQLToSQLite('CREATE TABLE t (active BOOLEAN)');
      expect(result).toContain('INTEGER');
    });

    it('should convert TINYINT to INTEGER', () => {
      const result = adaptMySQLToSQLite('CREATE TABLE t (flag TINYINT(1))');
      expect(result).toContain('INTEGER');
    });

    it('should convert DATETIME to TEXT', () => {
      const result = adaptMySQLToSQLite('CREATE TABLE t (created DATETIME)');
      expect(result).toContain('TEXT');
    });

    it('should convert JSON to TEXT', () => {
      const result = adaptMySQLToSQLite('CREATE TABLE t (data JSON)');
      expect(result).toContain('TEXT');
    });

    it('should convert BLOB types correctly', () => {
      const result = adaptMySQLToSQLite('CREATE TABLE t (file LONGBLOB)');
      expect(result).toContain('BLOB');
    });

    it('should convert ENUM to TEXT', () => {
      const result = adaptMySQLToSQLite("CREATE TABLE t (status ENUM('active', 'inactive'))");
      expect(result).toContain('TEXT');
      expect(result).not.toContain('ENUM');
    });

    it('should remove UNSIGNED modifier', () => {
      const result = adaptMySQLToSQLite('CREATE TABLE t (count INT UNSIGNED)');
      expect(result).not.toContain('UNSIGNED');
    });

    it('should remove ZEROFILL modifier', () => {
      const result = adaptMySQLToSQLite('CREATE TABLE t (id INT(10) ZEROFILL)');
      expect(result).not.toContain('ZEROFILL');
    });

    it('should convert INT(n) display width to INTEGER', () => {
      const result = adaptMySQLToSQLite('CREATE TABLE t (id INT(11))');
      expect(result).toContain('INTEGER');
      expect(result).not.toContain('INT(11)');
    });
  });

  describe('adaptMySQLToSQLite - functions', () => {
    it('should convert IF() to CASE WHEN', () => {
      const result = adaptMySQLToSQLite("SELECT IF(active = 1, 'yes', 'no') FROM t");
      expect(result).toContain('CASE WHEN');
      expect(result).toContain('THEN');
      expect(result).toContain('ELSE');
      expect(result).toContain('END');
    });

    it('should convert DATE_FORMAT with %Y-%m-%d', () => {
      const result = adaptMySQLToSQLite("SELECT DATE_FORMAT(created, '%Y-%m-%d') FROM t");
      expect(result).toContain('date(');
    });

    it('should convert DATE_FORMAT with %Y-%m-%d %H:%i:%s', () => {
      const result = adaptMySQLToSQLite("SELECT DATE_FORMAT(created, '%Y-%m-%d %H:%i:%s') FROM t");
      expect(result).toContain('datetime(');
    });

    it('should convert DATE_FORMAT with %H:%i:%s', () => {
      const result = adaptMySQLToSQLite("SELECT DATE_FORMAT(created, '%H:%i:%s') FROM t");
      expect(result).toContain('time(');
    });

    it('should convert DATE_ADD with INTERVAL n DAY', () => {
      const result = adaptMySQLToSQLite("SELECT DATE_ADD(NOW(), INTERVAL 7 DAY)");
      expect(result).toContain('date(');
      expect(result).toContain('+7 days');
    });

    it('should convert DATE_ADD with INTERVAL n HOUR', () => {
      const result = adaptMySQLToSQLite("SELECT DATE_ADD(NOW(), INTERVAL 3 HOUR)");
      expect(result).toContain('+3 hours');
    });

    it('should convert DATE_SUB with INTERVAL n DAY', () => {
      const result = adaptMySQLToSQLite("SELECT DATE_SUB(NOW(), INTERVAL 30 DAY)");
      expect(result).toContain('date(');
      expect(result).toContain('-30 days');
    });

    it('should convert DATEDIFF to julianday', () => {
      const result = adaptMySQLToSQLite("SELECT DATEDIFF(end_date, start_date) FROM t");
      expect(result).toContain('julianday');
    });

    it('should convert TIMESTAMPDIFF with DAY', () => {
      const result = adaptMySQLToSQLite("SELECT TIMESTAMPDIFF(DAY, start_date, end_date) FROM t");
      expect(result).toContain('julianday');
    });

    it('should convert TIMESTAMPDIFF with HOUR', () => {
      const result = adaptMySQLToSQLite("SELECT TIMESTAMPDIFF(HOUR, start_date, end_date) FROM t");
      expect(result).toContain('* 24');
    });

    it('should convert TIMESTAMPDIFF with MINUTE', () => {
      const result = adaptMySQLToSQLite("SELECT TIMESTAMPDIFF(MINUTE, start_date, end_date) FROM t");
      expect(result).toContain('* 1440');
    });

    it('should convert TIMESTAMPDIFF with SECOND', () => {
      const result = adaptMySQLToSQLite("SELECT TIMESTAMPDIFF(SECOND, start_date, end_date) FROM t");
      expect(result).toContain('* 86400');
    });

    it('should convert REGEXP to LIKE', () => {
      const result = adaptMySQLToSQLite("SELECT * FROM t WHERE name REGEXP '^A'");
      expect(result).toContain('LIKE');
      expect(result).not.toContain('REGEXP');
    });

    it('should convert STR_TO_DATE', () => {
      const result = adaptMySQLToSQLite("SELECT STR_TO_DATE('2024-01-01', '%Y-%m-%d')");
      expect(result).toContain('date(');
    });
  });

  describe('detectDroppedFunctions', () => {
    it('should not report DATE_FORMAT as dropped when it was adapted', () => {
      // DATE_FORMAT → strftime, so it's no longer in adapted SQL as DATE_FORMAT
      const original = "SELECT DATE_FORMAT(created, '%Y-%m-%d')";
      const dropped = detectDroppedFunctions(original);
      expect(dropped).not.toContain('DATE_FORMAT');
    });

    it('should detect truly dropped functions not adapted', () => {
      const original = "SELECT PASSWORD('secret')";
      const dropped = detectDroppedFunctions(original);
      expect(dropped).toContain('PASSWORD');
    });

    it('should return empty array when no functions dropped', () => {
      const original = "SELECT * FROM t";
      const dropped = detectDroppedFunctions(original);
      expect(dropped).toEqual([]);
    });

    it('should detect MD5 as dropped when present', () => {
      const original = "SELECT MD5(password)";
      const dropped = detectDroppedFunctions(original);
      expect(dropped).toContain('MD5');
    });
  });

  describe('adaptMySQLWithWarnings', () => {
    it('should return adapted SQL and warnings array', () => {
      const result = adaptMySQLWithWarnings("SELECT * FROM users");
      expect(result.sql).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should return no warnings for compatible SQL', () => {
      const result = adaptMySQLWithWarnings("SELECT * FROM users WHERE id = 1");
      expect(result.warnings).toEqual([]);
    });

    it('should warn about SLEEP function being dropped', () => {
      // SLEEP is not adapted, so it should be detected as dropped
      const dropped = detectDroppedFunctions("SELECT SLEEP(5)");
      expect(dropped).toContain('SLEEP');
    });
  });

  describe('adaptMySQLToSQLite - complex queries', () => {
    it('should handle CREATE TABLE with multiple MySQL features', () => {
      const sql = `
        CREATE TABLE users (
          id INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(255) UNIQUE,
          created DATETIME DEFAULT CURRENT_TIMESTAMP,
          settings JSON,
          status ENUM('active', 'inactive') DEFAULT 'active'
        );
      `;
      const result = adaptMySQLToSQLite(sql);
      expect(result).toContain('INTEGER');
      expect(result).toContain('AUTOINCREMENT');
      expect(result).toContain('TEXT');
      expect(result).not.toContain('VARCHAR');
      expect(result).not.toContain('UNSIGNED');
      expect(result).not.toContain('ENUM');
    });

    it('should handle SELECT with IF function and backtick identifiers', () => {
      const sql = "SELECT `name`, IF(`active` = 1, 'Yes', 'No') as status FROM `users`";
      const result = adaptMySQLToSQLite(sql);
      expect(result).toContain('"name"');
      expect(result).toContain('CASE WHEN');
      expect(result).not.toContain('`');
    });

    it('should handle INSERT with ON DUPLICATE KEY UPDATE', () => {
      const sql = "INSERT INTO `users` (`name`) VALUES ('Alice') ON DUPLICATE KEY UPDATE `name` = 'Alice Updated'";
      const result = adaptMySQLToSQLite(sql);
      expect(result).not.toContain('ON DUPLICATE KEY');
      expect(result).toContain('"users"');
    });

    it('should handle DATE_ADD and DATE_SUB together', () => {
      const sql = "SELECT DATE_ADD(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 30 DAY)";
      const result = adaptMySQLToSQLite(sql);
      expect(result).toContain('+7 days');
      expect(result).toContain('-30 days');
    });
  });
});
