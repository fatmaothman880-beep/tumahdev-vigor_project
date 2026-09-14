-- =============================================================================
-- VIGOR Smart Port Operations — Demo & Initial Production Seed Data
-- Import through phpMyAdmin AFTER importing schema.sql
-- All users strictly use @turkysgroup.co.tz company email domain
-- Default initial password for all seeded accounts: Turkys@2025
-- =============================================================================

-- 1. ROLES
INSERT INTO `roles` (`id`, `role_name`, `description`, `permissions`) VALUES
('role-admin', 'Admin', 'Full administrative control: user management, master data, system parameters', '["users:manage", "vessels:manage", "schedules:manage", "settings:manage", "reports:view", "audit:view"]'),
('role-mgmt', 'Management', 'Executive decision-making: CEO dashboard, vessel schedules, AI assistant, read-only analytics', '["dashboard:view", "vessels:view", "schedules:view", "ai:query", "reports:view"]'),
('role-ops', 'Operations', 'Port dispatcher & berth controller: vessel arrivals, discharge monitoring, delays, ETA updates', '["vessels:edit", "schedules:edit", "readings:record", "delays:record", "ai:query"]'),
('role-viewer', 'Viewer', 'Read-only operational stakeholder access', '["dashboard:view", "vessels:view", "schedules:view"]');

-- 2. AUTHORIZED COMPANY USERS (@turkysgroup.co.tz)
-- Pre-hashed with bcrypt (Password: Turkys@2025)
INSERT INTO `users` (`id`, `email`, `password_hash`, `full_name`, `department`, `role`, `status`, `created_at`) VALUES
('usr-001', 'admin@turkysgroup.co.tz', '$2a$10$Pq6yZ2aMvQj6YfWJkNuQ.O6H7zU/K7Xo1hQfS7wW4lZgDk6Qv7Z6e', 'Maryam Arshed (System Administrator)', 'Information Technology', 'Admin', 'Active', NOW()),
('usr-002', 'ceo@turkysgroup.co.tz', '$2a$10$Pq6yZ2aMvQj6YfWJkNuQ.O6H7zU/K7Xo1hQfS7wW4lZgDk6Qv7Z6e', 'Salim H. Turky (Executive Management)', 'Executive Office', 'Management', 'Active', NOW()),
('usr-003', 'ops.dispatcher@turkysgroup.co.tz', '$2a$10$Pq6yZ2aMvQj6YfWJkNuQ.O6H7zU/K7Xo1hQfS7wW4lZgDk6Qv7Z6e', 'Khamis Ali (Chief Port Dispatcher)', 'Terminal Operations', 'Operations', 'Active', NOW()),
('usr-004', 'auditor@turkysgroup.co.tz', '$2a$10$Pq6yZ2aMvQj6YfWJkNuQ.O6H7zU/K7Xo1hQfS7wW4lZgDk6Qv7Z6e', 'Zuwena Nassor (Internal Auditor)', 'Compliance & Audit', 'Viewer', 'Active', NOW()),
('usr-005', 'pending.trainee@turkysgroup.co.tz', '$2a$10$Pq6yZ2aMvQj6YfWJkNuQ.O6H7zU/K7Xo1hQfS7wW4lZgDk6Qv7Z6e', 'Juma Bakari (Operations Trainee)', 'Port Operations', 'Operations', 'Pending', NOW());

-- 3. BERTHS
INSERT INTO `berths` (`id`, `name`, `location`, `type`, `length_m`, `max_draft_m`, `maximum_vessel_size_t`, `default_unloading_rate_tph`, `status`, `notes`) VALUES
('B01', 'Berth B01 — VIGOR Dedicated', 'Malindi Port, Zanzibar Quay 1', 'Pneumatic Unloader Bulk Cement', 175.00, 9.50, 16000.00, 600.00, 'OCCUPIED', 'Primary pneumatic connection with direct feed into Silo 1 & Silo 2 via dual 10-inch pipelines.'),
('B02', 'Berth B02 — Malindi Wharf Secondary', 'Malindi Port, Zanzibar Quay 2', 'Multi-Purpose Bulk / Bagged', 150.00, 8.50, 12000.00, 450.00, 'AVAILABLE', 'Secondary berth for smaller coasters and general cargo overflow.'),
('B-MANGAPWANI', 'Mangapwani Terminal — Berth 1', 'Mangapwani Integrated Terminal', 'Deepwater Heavy Bulk', 220.00, 12.00, 30000.00, 850.00, 'AVAILABLE', 'New deepwater expansion facility for high-tonnage bulk cement carriers.');

-- 4. VESSELS
INSERT INTO `vessels` (`id`, `name`, `imo_reference`, `mmsi`, `capacity_t`, `agent_name`, `agent_phone`, `active`, `notes`) VALUES
('v-01', 'MV VIGOR 01', '9482104', '677048200', 10200.00, 'Zanzibar Shipping Agency Ltd', '+255 777 412 890', 1, 'Self-discharging pneumatic bulk cement carrier equipped with high-pressure blowers.'),
('v-02', 'MV VIGOR 02', '9531890', '677053100', 10200.00, 'Pemba Maritime Services', '+255 777 554 112', 1, 'Standard bulk carrier in regular shuttle rotation between Tanga factory and Zanzibar.'),
('v-03', 'MV VIGOR 03', '9618422', '677096100', 9800.00, 'Tanga Logistics & Marine Ltd', '+255 777 908 334', 1, 'Dedicated bulk carrier equipped with dust-suppression pneumatic transfer manifold.');

-- 5. ACTIVE VESSEL VISITS
INSERT INTO `vessel_visits` (`id`, `vessel_id`, `berth_id`, `voyage_number`, `cargo_type`, `cargo_total_t`, `unloaded_t`, `unloading_rate_tph`, `planned_arrival`, `actual_arrival`, `unload_start`, `forecast_unload_end`, `expected_berth_release`, `post_unloading_minutes`, `status`, `berth_conflict`, `conflict_notes`, `created_by`) VALUES
('voy-01', 'v-01', 'B01', 'VY-2025-014', 'Bulk Portland Cement 42.5R', 10500.00, 7560.00, 605.00,
 DATE_SUB(NOW(), INTERVAL 14 HOUR), DATE_SUB(NOW(), INTERVAL 12 HOUR), DATE_SUB(NOW(), INTERVAL 10 HOUR),
 DATE_ADD(NOW(), INTERVAL 4 HOUR 50 MINUTE), DATE_ADD(NOW(), INTERVAL 6 HOUR 20 MINUTE),
 90, 'UNLOADING', 0, NULL, 'usr-003'),

('voy-03', 'v-03', 'B01', 'VY-2025-015', 'Bulk Cement Type II', 9800.00, 0.00, 580.00,
 DATE_ADD(NOW(), INTERVAL 3 HOUR 45 MINUTE), NULL, NULL,
 DATE_ADD(NOW(), INTERVAL 20 HOUR), DATE_ADD(NOW(), INTERVAL 21 HOUR 30 MINUTE),
 90, 'PLANNED', 1, 'MV VIGOR 03 scheduled arrival precedes B01 berth clearance of MV VIGOR 01 by 2.6 hours. Eco-steaming recommended.', 'usr-003');

-- 6. READINGS
INSERT INTO `operational_readings` (`id`, `visit_id`, `recorded_at`, `source`, `unloaded_t`, `observed_rate_tph`, `buffer_level_t`, `buffer_capacity_t`, `packaging_rate_tph`, `unloading_status`, `notes`, `entered_by`) VALUES
('rd-01', 'voy-01', DATE_SUB(NOW(), INTERVAL 2 HOUR), 'TELEMETRY', 6350.00, 590.00, 790.00, 1200.00, 560.00, 'ACTIVE', 'Dual lines operating nominal.', 'Khamis Ali'),
('rd-02', 'voy-01', DATE_SUB(NOW(), INTERVAL 1 HOUR), 'TELEMETRY', 6950.00, 600.00, 810.00, 1200.00, 565.00, 'ACTIVE', 'Line pressure stabilized at 2.4 bar.', 'Khamis Ali'),
('rd-03', 'voy-01', NOW(), 'MANUAL', 7560.00, 605.00, 820.00, 1200.00, 570.00, 'ACTIVE', 'Pneumatic compressors operating at peak throughput.', 'Khamis Ali');

-- 7. DELAY EVENTS
INSERT INTO `delay_events` (`id`, `visit_id`, `start_time`, `end_time`, `category`, `cause`, `responsible_area`, `equipment`, `description`, `resolved`, `recorded_by`) VALUES
('del-01', 'voy-01', DATE_SUB(NOW(), INTERVAL 7 HOUR), DATE_SUB(NOW(), INTERVAL 6 HOUR 12 MINUTE), 'Technical', 'Pneumatic compressor valve gasket replacement on Silo Manifold B', 'Terminal Silo Ops', 'Manifold B Valve #3', 'Minor gasket leak isolated and replaced within 48 minutes.', 1, 'Khamis Ali');

-- 8. ACTIVITY LOGS
INSERT INTO `activity_logs` (`id`, `user_id`, `user_email`, `action`, `target_entity`, `target_id`, `details`) VALUES
('log-01', 'usr-001', 'admin@turkysgroup.co.tz', 'SYSTEM_INIT', 'SYSTEM', 'ROOT', 'Initialized VIGOR Smart Port Operations database and company security policies.'),
('log-02', 'usr-003', 'ops.dispatcher@turkysgroup.co.tz', 'READING_LOGGED', 'VESSEL_VISIT', 'voy-01', 'Logged pneumatic reading of 7,560T unloaded at Berth B01.'),
('log-03', 'usr-001', 'admin@turkysgroup.co.tz', 'USER_ROLE_ASSIGNED', 'USER', 'usr-002', 'Assigned Executive Management role to Salim H. Turky.');

-- 9. SYSTEM SETTINGS
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`, `updated_by`) VALUES
('post_unload_berth_buffer_hours', '1.5', 'Time required after discharge completion for line purge and clearance', 'admin@turkysgroup.co.tz'),
('payment_eligibility_threshold_percent', '100', 'Percentage of advance payment required before berth slot confirmation', 'admin@turkysgroup.co.tz'),
('company_email_domain', 'turkysgroup.co.tz', 'Exclusive allowed email domain for authentication and user access', 'admin@turkysgroup.co.tz'),
('port_timezone', 'Africa/Dar_es_Salaam', 'Operational timezone (East Africa Time)', 'admin@turkysgroup.co.tz');
