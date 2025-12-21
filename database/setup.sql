-- VAULT Banking System Database Setup
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE users (
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
CREATE TABLE payment_methods (
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
CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
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
CREATE TABLE deposit_requests (
    id BIGSERIAL PRIMARY KEY,
    request_id VARCHAR(50) UNIQUE NOT NULL,
    user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
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
CREATE TABLE withdrawal_requests (
    id BIGSERIAL PRIMARY KEY,
    request_id VARCHAR(50) UNIQUE NOT NULL,
    user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
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
CREATE TABLE system_settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_by VARCHAR(50),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referrals Table
CREATE TABLE referrals (
    id BIGSERIAL PRIMARY KEY,
    referrer_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    referred_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    commission DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(referrer_id, referred_id)
);

-- User Accounts Table
CREATE TABLE user_accounts (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    account_name VARCHAR(100) NOT NULL,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('checking', 'savings', 'investment', 'crypto')),
    account_number VARCHAR(100),
    balance DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Default Admin User
INSERT INTO users (user_id, first_name, last_name, email, password, role, balance) 
VALUES ('ADMIN001', 'Admin', 'User', 'admin@vault.com', 'admin123', 'admin', 100000.00);

-- Insert Default Payment Methods
INSERT INTO payment_methods (method_id, name, type, details, status) VALUES
('BANK001', 'Chase Bank Transfer', 'bank', 'Bank Name: Chase Bank\nAccount Number: 1234567890\nRouting Number: 021000021\nAccount Holder: VAULT Inc.', 'active'),
('CRYPTO001', 'Bitcoin (BTC)', 'crypto', 'Cryptocurrency: Bitcoin\nWallet Address: bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh\nNetwork: Bitcoin Network', 'active'),
('CRYPTO002', 'USDT (TRC20)', 'crypto', 'Cryptocurrency: USDT\nWallet Address: TY76yhJkU89oLpQwErtYhUvBnMpRfDcXz1\nNetwork: TRC20', 'active');

-- Insert Default System Settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('platform_name', 'VAULT', 'Platform display name'),
('interest_rate', '50', 'Weekly interest rate in percentage'),
('withdrawal_fee', '2', 'Withdrawal fee percentage'),
('min_deposit', '100', 'Minimum deposit amount'),
('min_withdrawal', '50', 'Minimum withdrawal amount'),
('referral_commission', '15', 'Referral commission percentage'),
('support_email', 'support@vault.com', 'Support email address');

-- Create Indexes for Performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_deposit_requests_status ON deposit_requests(status);
CREATE INDEX idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX idx_payment_methods_status ON payment_methods(status);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Users can view their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid()::text = email);

-- Payment methods are public (for display)
CREATE POLICY "Payment methods are public" ON payment_methods
    FOR SELECT USING (status = 'active');

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (user_id IN (SELECT user_id FROM users WHERE email = auth.uid()::text));

-- Admin can view all data
CREATE POLICY "Admin can view all data" ON users
    FOR SELECT USING ((SELECT role FROM users WHERE email = auth.uid()::text) = 'admin');

CREATE POLICY "Admin can insert payment methods" ON payment_methods
    FOR INSERT WITH CHECK ((SELECT role FROM users WHERE email = auth.uid()::text) = 'admin');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deposit_requests_updated_at BEFORE UPDATE ON deposit_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_withdrawal_requests_updated_at BEFORE UPDATE ON withdrawal_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_accounts_updated_at BEFORE UPDATE ON user_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle user balance updates
CREATE OR REPLACE FUNCTION update_user_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        IF NEW.type = 'deposit' THEN
            UPDATE users 
            SET balance = balance + NEW.amount,
                total_deposits = total_deposits + NEW.amount
            WHERE user_id = NEW.user_id;
        ELSIF NEW.type = 'withdrawal' THEN
            UPDATE users 
            SET balance = balance - NEW.amount,
                total_withdrawals = total_withdrawals + NEW.amount
            WHERE user_id = NEW.user_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_balance_on_transaction 
AFTER UPDATE ON transactions
FOR EACH ROW EXECUTE FUNCTION update_user_balance();