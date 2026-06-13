-- Add display control columns to games table
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS show_on_main_page BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 999;

-- Update existing games to have default values
UPDATE games 
SET show_on_main_page = TRUE, display_order = 999 
WHERE show_on_main_page IS NULL OR display_order IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_games_display_order ON games(display_order);
CREATE INDEX IF NOT EXISTS idx_games_main_page_display ON games(show_on_main_page, display_order, name);
