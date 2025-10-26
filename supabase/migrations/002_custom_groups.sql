-- Create custom_groups table for storing user's custom betting groups
CREATE TABLE IF NOT EXISTS custom_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  groups JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_custom_groups_user_id ON custom_groups(user_id);

-- Enable Row Level Security
ALTER TABLE custom_groups ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own custom groups
CREATE POLICY "Users can view their own custom groups"
  ON custom_groups
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own custom groups
CREATE POLICY "Users can insert their own custom groups"
  ON custom_groups
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own custom groups
CREATE POLICY "Users can update their own custom groups"
  ON custom_groups
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can delete their own custom groups
CREATE POLICY "Users can delete their own custom groups"
  ON custom_groups
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_custom_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before updates
CREATE TRIGGER update_custom_groups_timestamp
  BEFORE UPDATE ON custom_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_groups_updated_at();
