#!/bin/bash

# Script to apply database migration to Supabase
# This creates all tables needed for Elite tier cloud storage

echo "📦 Applying Betting Assistant migration to Supabase..."

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Link to project
echo "🔗 Linking to Supabase project..."
supabase link --project-ref jovecrxutogsudfkpldz

# Apply migration
echo "⬆️  Applying migration..."
supabase db push

echo "✅ Migration complete! Cloud storage is now enabled."
echo ""
echo "Tables created:"
echo "  - casinos"
echo "  - dealers"
echo "  - betting_sessions"
echo "  - betting_cards"
echo "  - betting_card_steps"
echo ""
echo "You can now use Elite tier features with cloud sync!"
