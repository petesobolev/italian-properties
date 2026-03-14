-- Add short reference code for easy property sharing
-- Format: IT-XXXXX (5 alphanumeric characters)

ALTER TABLE properties
ADD COLUMN ref_code VARCHAR(10) UNIQUE;

-- Create index for fast lookups by ref_code
CREATE INDEX idx_properties_ref_code ON properties(ref_code);

-- Function to generate a random alphanumeric code
CREATE OR REPLACE FUNCTION generate_ref_code()
RETURNS VARCHAR(10) AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- Excludes I, O, 0, 1 to avoid confusion
    result TEXT := 'IT-';
    i INTEGER;
BEGIN
    FOR i IN 1..5 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Generate ref_codes for all existing properties
DO $$
DECLARE
    prop RECORD;
    new_code VARCHAR(10);
    code_exists BOOLEAN;
BEGIN
    FOR prop IN SELECT id FROM properties WHERE ref_code IS NULL LOOP
        LOOP
            new_code := generate_ref_code();
            SELECT EXISTS(SELECT 1 FROM properties WHERE ref_code = new_code) INTO code_exists;
            EXIT WHEN NOT code_exists;
        END LOOP;
        UPDATE properties SET ref_code = new_code WHERE id = prop.id;
    END LOOP;
END $$;

-- Make ref_code NOT NULL after populating existing rows
ALTER TABLE properties ALTER COLUMN ref_code SET NOT NULL;

-- Create trigger to auto-generate ref_code for new properties
CREATE OR REPLACE FUNCTION set_ref_code()
RETURNS TRIGGER AS $$
DECLARE
    new_code VARCHAR(10);
    code_exists BOOLEAN;
BEGIN
    IF NEW.ref_code IS NULL THEN
        LOOP
            new_code := generate_ref_code();
            SELECT EXISTS(SELECT 1 FROM properties WHERE ref_code = new_code) INTO code_exists;
            EXIT WHEN NOT code_exists;
        END LOOP;
        NEW.ref_code := new_code;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_ref_code
    BEFORE INSERT ON properties
    FOR EACH ROW
    EXECUTE FUNCTION set_ref_code();
