-- Function to auto-create user in users table when they sign up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    referral_code text;
    first_name text;
    last_name text;
BEGIN
    -- Extract first and last name from email or metadata
    IF NEW.raw_user_meta_data->>'first_name' IS NOT NULL THEN
        first_name := NEW.raw_user_meta_data->>'first_name';
    ELSE
        first_name := split_part(NEW.email, '@', 1);
    END IF;
    
    last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
    
    -- Generate referral code
    referral_code := UPPER(LEFT(first_name, 3) || LEFT(last_name, 3) || 
                          RIGHT(CAST(EXTRACT(EPOCH FROM NOW()) AS text), 4));
    
    -- Insert into users table
    INSERT INTO public.users (
        user_id,
        email,
        first_name,
        last_name,
        phone,
        role,
        status,
        balance,
        referral_code,
        join_date,
        created_at,
        updated_at
    ) VALUES (
        'USER_' || REPLACE(CAST(NEW.id AS text), '-', '_'),
        NEW.email,
        first_name,
        last_name,
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        CASE WHEN NEW.email = 'arinze18@vault.com' THEN 'admin' ELSE 'user' END,
        'active',
        1000.00,
        referral_code,
        NOW(),
        NOW(),
        NOW()
    );
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail (user can still login and be created later)
    RAISE NOTICE 'Error creating user in users table: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user in users table when they sign up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();