-- Studio Desk database schema for MySQL
-- Run this once in your MySQL database
-- Note: MySQL does not support Row Level Security (RLS), so all security filtering
-- must be done in the application layer

-- ---------------------------------------------------------------- tenants
CREATE TABLE studios (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL DEFAULT 'My Studio',
  phone VARCHAR(20),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE studio_members (
  studio_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'staff')),
  PRIMARY KEY (studio_id, user_id),
  FOREIGN KEY (studio_id) REFERENCES studios(id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------- data
CREATE TABLE bookings (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  studio_id VARCHAR(36) NOT NULL,
  client VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  insta VARCHAR(100),
  source VARCHAR(50) CHECK (source IN ('whatsapp', 'instagram', 'call', 'website', 'referral')),
  kind VARCHAR(50) NOT NULL DEFAULT 'bride' CHECK (kind IN ('bride', 'engagement', 'party', 'event')),
  status VARCHAR(50) NOT NULL DEFAULT 'enquiry' CHECK (status IN ('enquiry', 'confirmed', 'done', 'cancelled')),
  service VARCHAR(255),
  event_date DATE,
  event_time TIME,
  trial_date DATE,
  venue VARCHAR(255),
  total DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  paid DECIMAL(12, 2) NOT NULL DEFAULT 0,
  confirmation_sent BOOLEAN NOT NULL DEFAULT FALSE,
  notes LONGTEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (studio_id) REFERENCES studios(id) ON DELETE CASCADE,
  INDEX idx_studio_date (studio_id, event_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE students (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  studio_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  insta VARCHAR(100),
  source VARCHAR(50) CHECK (source IN ('whatsapp', 'instagram', 'call', 'website', 'referral')),
  course VARCHAR(100) NOT NULL DEFAULT 'Basic',
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'left')),
  batch VARCHAR(255),
  start_date DATE,
  fee DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (fee >= 0),
  paid DECIMAL(12, 2) NOT NULL DEFAULT 0,
  notes LONGTEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (studio_id) REFERENCES studios(id) ON DELETE CASCADE,
  INDEX idx_studio (studio_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE leads (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  studio_id VARCHAR(36) NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(20),
  insta VARCHAR(100),
  source VARCHAR(50) CHECK (source IN ('whatsapp', 'instagram', 'call', 'website', 'referral')),
  kind VARCHAR(50) NOT NULL DEFAULT 'bride' CHECK (kind IN ('bride', 'engagement', 'party', 'event', 'student')),
  service VARCHAR(255),
  event_date DATE,
  event_time TIME,
  venue VARCHAR(255),
  summary VARCHAR(255),
  message LONGTEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'converted', 'dismissed')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (studio_id) REFERENCES studios(id) ON DELETE CASCADE,
  INDEX idx_studio_status (studio_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payments (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  studio_id VARCHAR(36) NOT NULL,
  booking_id VARCHAR(36),
  student_id VARCHAR(36),
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  note VARCHAR(255),
  paid_on DATE NOT NULL DEFAULT CURDATE(),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (studio_id) REFERENCES studios(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT chk_booking_or_student CHECK (
    (booking_id IS NOT NULL AND student_id IS NULL) OR
    (booking_id IS NULL AND student_id IS NOT NULL)
  ),
  INDEX idx_booking (booking_id),
  INDEX idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE message_templates (
  studio_id VARCHAR(36) NOT NULL,
  key VARCHAR(100) NOT NULL,
  body LONGTEXT NOT NULL,
  PRIMARY KEY (studio_id, key),
  FOREIGN KEY (studio_id) REFERENCES studios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------- triggers
DELIMITER $$

-- Trigger to update bookings.updated_at on modification
CREATE TRIGGER bookings_touch BEFORE UPDATE ON bookings
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

-- Trigger to update students.updated_at on modification
CREATE TRIGGER students_touch BEFORE UPDATE ON students
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

-- Trigger to refresh bookings.paid after payment insert/update
CREATE TRIGGER payments_refresh_after_insert AFTER INSERT ON payments
FOR EACH ROW
BEGIN
  IF NEW.booking_id IS NOT NULL THEN
    UPDATE bookings
    SET paid = (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE booking_id = NEW.booking_id)
    WHERE id = NEW.booking_id;
  END IF;
  IF NEW.student_id IS NOT NULL THEN
    UPDATE students
    SET paid = (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE student_id = NEW.student_id)
    WHERE id = NEW.student_id;
  END IF;
END$$

-- Trigger to refresh paid after payment update
CREATE TRIGGER payments_refresh_after_update AFTER UPDATE ON payments
FOR EACH ROW
BEGIN
  IF NEW.booking_id IS NOT NULL THEN
    UPDATE bookings
    SET paid = (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE booking_id = NEW.booking_id)
    WHERE id = NEW.booking_id;
  END IF;
  IF NEW.student_id IS NOT NULL THEN
    UPDATE students
    SET paid = (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE student_id = NEW.student_id)
    WHERE id = NEW.student_id;
  END IF;
END$$

-- Trigger to refresh paid after payment delete
CREATE TRIGGER payments_refresh_after_delete AFTER DELETE ON payments
FOR EACH ROW
BEGIN
  IF OLD.booking_id IS NOT NULL THEN
    UPDATE bookings
    SET paid = (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE booking_id = OLD.booking_id)
    WHERE id = OLD.booking_id;
  END IF;
  IF OLD.student_id IS NOT NULL THEN
    UPDATE students
    SET paid = (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE student_id = OLD.student_id)
    WHERE id = OLD.student_id;
  END IF;
END$$

DELIMITER ;

-- ---------------------------------------------------------------- seed data
INSERT INTO message_templates (studio_id, key, body)
SELECT
  id, 'enquiry_reply',
  'Hi {{name}}, thank you for your enquiry! I am checking my availability for {{date}}. Could you please share the venue, the timing and how many people need makeup? I will send the details and pricing right away. - {{studio}}'
FROM studios
ON DUPLICATE KEY UPDATE key='enquiry_reply';

INSERT INTO message_templates (studio_id, key, body)
SELECT
  id, 'confirmation',
  'Hi {{name}}, your booking is confirmed!\n\nService: {{service}}\nDate: {{date}}\nTime: {{time}}\nVenue: {{venue}}\nTotal: {{total}}\nAdvance received: {{paid}}\nBalance due: {{balance}}\n\nPlease come with a clean, moisturised face and share a photo of your outfit. Thank you! - {{studio}}'
FROM studios
ON DUPLICATE KEY UPDATE key='confirmation';

INSERT INTO message_templates (studio_id, key, body)
SELECT
  id, 'reminder',
  'Hi {{name}}, a quick reminder about your {{service}} booking on {{date}} at {{time}} ({{venue}}). The balance due is {{balance}}. Please reply to confirm. Thank you! - {{studio}}'
FROM studios
ON DUPLICATE KEY UPDATE key='reminder';

INSERT INTO message_templates (studio_id, key, body)
SELECT
  id, 'balance_due',
  'Hi {{name}}, a gentle reminder that {{balance}} is pending for your booking on {{date}}. Please let me know when you can pay. Thank you! - {{studio}}'
FROM studios
ON DUPLICATE KEY UPDATE key='balance_due';

INSERT INTO message_templates (studio_id, key, body)
SELECT
  id, 'student_fee',
  'Hi {{name}}, a gentle reminder that {{balance}} is pending for the {{course}} course. Please let me know when you can pay. Thank you! - {{studio}}'
FROM studios
ON DUPLICATE KEY UPDATE key='student_fee';

INSERT INTO message_templates (studio_id, key, body)
SELECT
  id, 'review_request',
  'Hi {{name}}, thank you for choosing {{studio}}! If you loved your look, a quick Google review would mean a lot to us.'
FROM studios
ON DUPLICATE KEY UPDATE key='review_request';
