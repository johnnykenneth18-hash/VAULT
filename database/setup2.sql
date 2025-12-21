-- VAULT Banking System Database Setup
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    balance DECIMAL(15,2) DEFAULT 0.00,
    total_deposits DECIMAL(15,2) DEFAULT 0.00,
    total_withdrawals DECIMAL(15,2) DEFAULT 0.00,
    total_interest DECIMAL(15,2) DEFAULT 0.00,
    referral_code VARCHAR(50) UNIQUE,
    referral_earnings DECIMAL(15,2) DEFAULT 0.00,
    join_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Methods Table
CREATE TABLE IF NOT EXISTS payment_methods (
    id BIGSERIAL PRIMARY KEY,
    method_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('bank', 'crypto', 'card')),
    details TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer', 'interest', 'commission')),
    amount DECIMAL(15,2) NOT NULL,
    fee DECIMAL(15,2) DEFAULT 0.00,
    net_amount DECIMAL(15,2),
    method VARCHAR(100),
    method_details TEXT,
    reference VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    description TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_by VARCHAR(50),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deposit Requests Table
CREATE TABLE IF NOT EXISTS deposit_requests (
    id BIGSERIAL PRIMARY KEY,
    request_id VARCHAR(50) UNIQUE NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    weeks INTEGER DEFAULT 4,
    method VARCHAR(100) NOT NULL,
    method_details TEXT,
    reference VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Withdrawal Requests Table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id BIGSERIAL PRIMARY KEY,
    request_id VARCHAR(50) UNIQUE NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    fee DECIMAL(15,2) DEFAULT 0.00,
    net_amount DECIMAL(15,2),
    method VARCHAR(100) NOT NULL,
    method_details TEXT,
    account_details TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_by VARCHAR(50),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referrals Table
CREATE TABLE IF NOT EXISTS referrals (
    id BIGSERIAL PRIMARY KEY,
    referrer_id VARCHAR(50) NOT NULL,
    referred_id VARCHAR(50) NOT NULL,
    commission DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(referrer_id, referred_id)
);

-- User Accounts Table
CREATE TABLE IF NOT EXISTS user_accounts (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('checking', 'savings', 'investment', 'crypto')),
    account_number VARCHAR(100),
    balance DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Default Admin User (only if doesn't exist)
INSERT INTO users (user_id, first_name, last_name, email, role, balance) 
VALUES ('ADMIN001', 'Admin', 'User', 'admin@vault.com', 'admin', 100000.00)
ON CONFLICT (email) DO NOTHING;

-- Insert Default Payment Methods (only if doesn't exist)
INSERT INTO payment_methods (method_id, name, type, details, status) VALUES
('BANK001', 'Chase Bank Transfer', 'bank', 'Bank Name: Chase Bank\nAccount Number: 1234567890\nRouting Number: 021000021\nAccount Holder: VAULT Inc.', 'active')
ON CONFLICT (method_id) DO NOTHING;

INSERT INTO payment_methods (method_id, name, type, details, status) VALUES
('CRYPTO001', 'Bitcoin (BTC)', 'crypto', 'Cryptocurrency: Bitcoin\nWallet Address: bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh\nNetwork: Bitcoin Network', 'active')
ON CONFLICT (method_id) DO NOTHING;

INSERT INTO payment_methods (method_id, name, type, details, status) VALUES
('CRYPTO002', 'USDT (TRC20)', 'crypto', 'Cryptocurrency: USDT\nWallet Address: TY76yhJkU89oLpQwErtYhUvBnMpRfDcXz1\nNetwork: TRC20', 'active')
ON CONFLICT (method_id) DO NOTHING;

-- Insert Default System Settings (only if doesn't exist)
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('platform_name', 'VAULT', 'Platform display name')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('interest_rate', '50', 'Weekly interest rate in percentage')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('withdrawal_fee', '2', 'Withdrawal fee percentage')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('min_deposit', '100', 'Minimum deposit amount')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('min_withdrawal', '50', 'Minimum withdrawal amount')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('referral_commission', '15', 'Referral commission percentage')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('support_email', 'support@vault.com', 'Support email address')
ON CONFLICT (setting_key) DO NOTHING;

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_deposit_requests_status ON deposit_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_methods_status ON payment_methods(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payment_methods_updated_at') THEN
        CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_deposit_requests_updated_at') THEN
        CREATE TRIGGER update_deposit_requests_updated_at BEFORE UPDATE ON deposit_requests
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_withdrawal_requests_updated_at') THEN
        CREATE TRIGGER update_withdrawal_requests_updated_at BEFORE UPDATE ON withdrawal_requests
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_accounts_updated_at') THEN
        CREATE TRIGGER update_user_accounts_updated_at BEFORE UPDATE ON user_accounts
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Create function to handle user balance updates
CREATE OR REPLACE FUNCTION update_user_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        IF NEW.type = 'deposit' THEN
            UPDATE users 
            SET balance = balance + NEW.amount,
                total_deposits = total_deposits + NEW.amount,
                updated_at = NOW()
            WHERE user_id = NEW.user_id;
        ELSIF NEW.type = 'withdrawal' THEN
            UPDATE users 
            SET balance = balance - NEW.amount,
                total_withdrawals = total_withdrawals + NEW.amount,
                updated_at = NOW()
            WHERE user_id = NEW.user_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for transactions (only if doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_balance_on_transaction') THEN
        CREATE TRIGGER update_balance_on_transaction 
        AFTER UPDATE ON transactions
        FOR EACH ROW EXECUTE FUNCTION update_user_balance();
    END IF;
END $$;