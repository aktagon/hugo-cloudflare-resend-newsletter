-- Newsletter subscribers database schema
CREATE TABLE subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  active BOOLEAN DEFAULT TRUE
);

-- Index for better query performance
CREATE INDEX idx_subscribers_active ON subscribers(active);
CREATE INDEX idx_subscribers_email ON subscribers(email);