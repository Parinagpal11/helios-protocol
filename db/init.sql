-- Helios Protocol — Database Schema

-- Solar systems registered on Helios
CREATE TABLE IF NOT EXISTS systems (
  id              VARCHAR(64) PRIMARY KEY,
  owner_wallet    VARCHAR(64) NOT NULL,
  state           VARCHAR(4)  NOT NULL,
  inverter_type   VARCHAR(32) DEFAULT 'enphase',
  system_size_kw  DECIMAL(8,2),
  lifetime_kwh    DECIMAL(12,4) DEFAULT 0,
  last_polled_at  TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- SREC certificates minted on-chain
CREATE TABLE IF NOT EXISTS srecs (
  id              SERIAL PRIMARY KEY,
  system_id       VARCHAR(64) REFERENCES systems(id),
  owner_wallet    VARCHAR(64) NOT NULL,
  state           VARCHAR(4)  NOT NULL,
  vintage_year    INTEGER     NOT NULL,
  mwh_generated   DECIMAL(8,4) NOT NULL,
  mint_tx_hash    VARCHAR(128),
  cnft_asset_id   VARCHAR(128) UNIQUE,
  status          VARCHAR(16) DEFAULT 'minted', -- minted | listed | sold | burned
  list_price_usdc DECIMAL(10,2),
  listed_at       TIMESTAMP,
  sold_at         TIMESTAMP,
  buyer_wallet    VARCHAR(64),
  sale_tx_hash    VARCHAR(128),
  retire_proof    TEXT,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Oracle poll log
CREATE TABLE IF NOT EXISTS oracle_polls (
  id            SERIAL PRIMARY KEY,
  system_id     VARCHAR(64) REFERENCES systems(id),
  lifetime_kwh  DECIMAL(12,4),
  delta_kwh     DECIMAL(8,4),
  srecs_minted  INTEGER DEFAULT 0,
  polled_at     TIMESTAMP DEFAULT NOW()
);

-- Insert demo systems for development
INSERT INTO systems (id, owner_wallet, state, inverter_type, system_size_kw, lifetime_kwh)
VALUES
  ('SYS-NJ-001', 'DemoWallet1111111111111111111111111111111111', 'NJ', 'enphase', 10.0, 0),
  ('SYS-DC-001', 'DemoWallet2222222222222222222222222222222222', 'DC', 'solaredge', 8.5, 0),
  ('SYS-MA-001', 'DemoWallet3333333333333333333333333333333333', 'MA', 'enphase', 12.0, 0)
ON CONFLICT (id) DO NOTHING;
