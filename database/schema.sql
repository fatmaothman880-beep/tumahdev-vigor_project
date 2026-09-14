-- =============================================================================
-- VIGOR Smart Port Operations — Relational Database Schema
-- Target: cPanel MySQL 8.0+ / MariaDB 10.4+
-- Encoding: UTF-8 Unicode (utf8mb4_unicode_ci)
-- Deployment: VIGOR Cement Works / Turkys Group · Zanzibar
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+03:00"; -- East Africa Time (EAT)

-- -----------------------------------------------------------------------------
-- 1. ROLES & PERMISSIONS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` VARCHAR(36) NOT NULL,
  `role_name` VARCHAR(50) NOT NULL UNIQUE,
  `description` VARCHAR(255) NOT NULL,
  `permissions` JSON NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. USERS (Restricted strictly to @turkysgroup.co.tz)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` VARCHAR(36) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `department` VARCHAR(100) DEFAULT 'Operations',
  `role` ENUM('Admin', 'Management', 'Operations', 'Viewer') NOT NULL DEFAULT 'Viewer',
  `status` ENUM('Active', 'Disabled', 'Pending') NOT NULL DEFAULT 'Pending',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. BERTHS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `berths`;
CREATE TABLE `berths` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(120) NOT NULL UNIQUE,
  `location` VARCHAR(150) NOT NULL DEFAULT 'Zanzibar Port',
  `type` VARCHAR(80) NOT NULL DEFAULT 'Bulk Cement Dedicated',
  `length_m` DECIMAL(8,2) NOT NULL DEFAULT 165.00,
  `max_draft_m` DECIMAL(5,2) NOT NULL DEFAULT 9.50,
  `maximum_vessel_size_t` DECIMAL(12,2) NOT NULL DEFAULT 15000.00,
  `default_unloading_rate_tph` DECIMAL(8,2) NOT NULL DEFAULT 600.00,
  `status` ENUM('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED') NOT NULL DEFAULT 'AVAILABLE',
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. FLEET VESSELS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `vessels`;
CREATE TABLE `vessels` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `imo_reference` VARCHAR(30) NULL,
  `mmsi` VARCHAR(30) NULL,
  `capacity_t` DECIMAL(12,2) NOT NULL DEFAULT 10000.00,
  `agent_name` VARCHAR(150) NULL,
  `agent_phone` VARCHAR(50) NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_vessels_name` (`name`),
  INDEX `idx_vessels_imo` (`imo_reference`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. VESSEL VISITS / ROTATIONS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `vessel_visits`;
CREATE TABLE `vessel_visits` (
  `id` VARCHAR(36) NOT NULL,
  `vessel_id` VARCHAR(36) NOT NULL,
  `berth_id` VARCHAR(36) NOT NULL,
  `voyage_number` VARCHAR(50) NOT NULL,
  `cargo_type` VARCHAR(100) NOT NULL DEFAULT 'Bulk Cement',
  `cargo_total_t` DECIMAL(12,2) NOT NULL,
  `unloaded_t` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `unloading_rate_tph` DECIMAL(8,2) NOT NULL DEFAULT 600.00,
  `planned_arrival` TIMESTAMP NOT NULL,
  `actual_arrival` TIMESTAMP NULL DEFAULT NULL,
  `unload_start` TIMESTAMP NULL DEFAULT NULL,
  `unload_end` TIMESTAMP NULL DEFAULT NULL,
  `planned_departure` TIMESTAMP NULL DEFAULT NULL,
  `actual_departure` TIMESTAMP NULL DEFAULT NULL,
  `forecast_unload_end` TIMESTAMP NULL DEFAULT NULL,
  `expected_berth_release` TIMESTAMP NULL DEFAULT NULL,
  `post_unloading_minutes` INT NOT NULL DEFAULT 90,
  `status` ENUM('PLANNED', 'ARRIVED', 'BERTHED', 'UNLOADING', 'COMPLETED', 'DEPARTED', 'CANCELLED') NOT NULL DEFAULT 'PLANNED',
  `berth_conflict` TINYINT(1) NOT NULL DEFAULT 0,
  `conflict_notes` TEXT NULL,
  `created_by` VARCHAR(36) NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_visits_vessel` FOREIGN KEY (`vessel_id`) REFERENCES `vessels` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_visits_berth` FOREIGN KEY (`berth_id`) REFERENCES `berths` (`id`) ON DELETE RESTRICT,
  INDEX `idx_visits_status` (`status`),
  INDEX `idx_visits_arrival` (`planned_arrival`),
  INDEX `idx_visits_release` (`expected_berth_release`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. OPERATIONAL READINGS (Pneumatic Silo Discharge Monitoring)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `operational_readings`;
CREATE TABLE `operational_readings` (
  `id` VARCHAR(36) NOT NULL,
  `visit_id` VARCHAR(36) NOT NULL,
  `recorded_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `source` ENUM('MANUAL', 'CSV', 'DEMO', 'TELEMETRY') NOT NULL DEFAULT 'MANUAL',
  `unloaded_t` DECIMAL(12,2) NOT NULL,
  `observed_rate_tph` DECIMAL(8,2) NULL,
  `buffer_level_t` DECIMAL(12,2) NULL,
  `buffer_capacity_t` DECIMAL(12,2) NULL DEFAULT 1200.00,
  `packaging_rate_tph` DECIMAL(8,2) NULL,
  `unloading_status` ENUM('ACTIVE', 'STOPPED', 'COMPLETED') NOT NULL DEFAULT 'ACTIVE',
  `notes` TEXT NULL,
  `entered_by` VARCHAR(150) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_readings_visit` FOREIGN KEY (`visit_id`) REFERENCES `vessel_visits` (`id`) ON DELETE CASCADE,
  INDEX `idx_readings_visit_time` (`visit_id`, `recorded_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. DELAY EVENTS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `delay_events`;
CREATE TABLE `delay_events` (
  `id` VARCHAR(36) NOT NULL,
  `visit_id` VARCHAR(36) NOT NULL,
  `start_time` TIMESTAMP NOT NULL,
  `end_time` TIMESTAMP NULL DEFAULT NULL,
  `category` VARCHAR(60) NOT NULL DEFAULT 'Technical',
  `cause` VARCHAR(255) NOT NULL,
  `responsible_area` VARCHAR(100) NOT NULL DEFAULT 'Terminal Silo Ops',
  `equipment` VARCHAR(100) NULL,
  `description` TEXT NULL,
  `resolved` TINYINT(1) NOT NULL DEFAULT 0,
  `recorded_by` VARCHAR(150) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_delays_visit` FOREIGN KEY (`visit_id`) REFERENCES `vessel_visits` (`id`) ON DELETE CASCADE,
  INDEX `idx_delays_resolved` (`resolved`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. UPCOMING VESSEL CALLS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `upcoming_vessel_calls`;
CREATE TABLE `upcoming_vessel_calls` (
  `id` VARCHAR(36) NOT NULL,
  `vessel_id` VARCHAR(36) NOT NULL,
  `berth_id` VARCHAR(36) NOT NULL,
  `expected_arrival` TIMESTAMP NOT NULL,
  `cargo_type` VARCHAR(100) NOT NULL DEFAULT 'Bulk Cement',
  `cargo_quantity_t` DECIMAL(12,2) NOT NULL,
  `expected_rate_tph` DECIMAL(8,2) NULL DEFAULT 580.00,
  `confirmation_due_at` TIMESTAMP NULL DEFAULT NULL,
  `confirmed_at` TIMESTAMP NULL DEFAULT NULL,
  `berth_preparation_minutes` INT NOT NULL DEFAULT 60,
  `status` ENUM('PLANNED', 'CONFIRMED', 'ARRIVED', 'CANCELLED') NOT NULL DEFAULT 'PLANNED',
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_calls_vessel` FOREIGN KEY (`vessel_id`) REFERENCES `vessels` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_calls_berth` FOREIGN KEY (`berth_id`) REFERENCES `berths` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 9. SYSTEM ALERTS & NOTIFICATIONS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,
  `severity` ENUM('INFO', 'WARNING', 'CRITICAL') NOT NULL DEFAULT 'INFO',
  `category` VARCHAR(60) NOT NULL DEFAULT 'OPERATIONS',
  `vessel_id` VARCHAR(36) NULL,
  `visit_id` VARCHAR(36) NULL,
  `acknowledged` TINYINT(1) NOT NULL DEFAULT 0,
  `acknowledged_by` VARCHAR(36) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_notif_ack` (`acknowledged`),
  INDEX `idx_notif_severity` (`severity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 10. AUDIT & ACTIVITY LOGS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `activity_logs`;
CREATE TABLE `activity_logs` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NULL,
  `user_email` VARCHAR(191) NOT NULL,
  `action` VARCHAR(80) NOT NULL,
  `target_entity` VARCHAR(80) NOT NULL,
  `target_id` VARCHAR(80) NULL,
  `details` TEXT NULL,
  `ip_address` VARCHAR(50) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_activity_user` (`user_email`),
  INDEX `idx_activity_entity` (`target_entity`, `target_id`),
  INDEX `idx_activity_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 11. SYSTEM SETTINGS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `system_settings`;
CREATE TABLE `system_settings` (
  `setting_key` VARCHAR(80) NOT NULL,
  `setting_value` TEXT NOT NULL,
  `description` VARCHAR(255) NULL,
  `updated_by` VARCHAR(150) NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
