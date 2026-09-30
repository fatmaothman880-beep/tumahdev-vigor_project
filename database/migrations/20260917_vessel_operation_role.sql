-- Apply once to existing MySQL installations before deploying the renamed role.
ALTER TABLE users MODIFY role ENUM('Admin', 'Management', 'Operations', 'Vessel Operation', 'Viewer') NOT NULL DEFAULT 'Viewer';
UPDATE users SET role = 'Vessel Operation' WHERE role = 'Operations';
UPDATE roles SET role_name = 'Vessel Operation' WHERE role_name = 'Operations';
ALTER TABLE users MODIFY role ENUM('Admin', 'Management', 'Vessel Operation', 'Viewer') NOT NULL DEFAULT 'Viewer';
