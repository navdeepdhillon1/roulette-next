# Betting Assistant Cloud Storage Setup

This guide will help you set up cloud storage for the Elite tier Betting Assistant.

## 📋 Prerequisites

- Supabase account and project already created
- Supabase connection configured in `.env.local`
- Elite tier subscription active

## 🗄️ Database Setup

### Step 1: Apply Migration to Supabase

You need to create the tables in your Supabase database. You have two options:

#### **Option A: Using Supabase Dashboard (Recommended)**

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/001_betting_assistant_tables.sql`
5. Paste it into the SQL editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned" - this is normal

#### **Option B: Using Supabase CLI**

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run the migration
supabase db push
```

### Step 2: Verify Tables Were Created

1. In Supabase Dashboard, go to **Table Editor**
2. You should see five new tables:
   - `casinos`
   - `dealers`
   - `betting_sessions`
   - `betting_cards`
   - `betting_card_steps`

## ✅ Verification Checklist

- [ ] Tables created successfully
- [ ] Row Level Security (RLS) enabled on all tables
- [ ] Indexes created
- [ ] Policies applied
- [ ] `updated_at` triggers working

## 🔐 Security

The migration automatically sets up Row Level Security (RLS) with the following policies:

- ✅ Users can **only see their own** sessions, cards, and steps
- ✅ Users can **only modify their own** data
- ✅ All operations require authentication

## 📊 What Gets Stored

### casinos
- Casino name, type (online/physical)
- Physical: location, address
- Online: website, platform (e.g., Evolution Gaming)
- User notes, favorite status
- Auto-calculated stats: total sessions, total profit

### dealers
- Dealer name, nickname
- Physical attributes: gender, appearance
- Schedule: typical shift times
- User notes, rating (1-5 stars)
- Auto-calculated stats: total spins, win rate, total profit

### betting_sessions
- Session configuration (bankroll, bet system, etc.)
- Current state (card index, bankroll, totals)
- Status (active/completed/abandoned)
- Optional: linked casino, table/wheel number
- Timestamps

### betting_cards
- Card number, target, max bets
- Current progress (total, bets used)
- Status (locked/active/completed/failed)
- Performance metrics (discipline %)

### betting_card_steps
- Each individual bet or skip
- Bet details (type, groups, stake)
- Outcomes (win/loss/push)
- Running totals
- Decision engine suggestions vs user actions
- Optional: linked dealer

## 🚀 Next Steps

After database setup is complete:

1. The `lib/bettingAssistantStorage.ts` helper functions are ready to use
2. Next update will integrate auto-save into `BettingAssistant.tsx`
3. Add session resume functionality
4. Add session history viewer

## 🔍 Troubleshooting

### "relation does not exist" error
- Make sure the migration SQL was run successfully
- Check the SQL Editor for any error messages

### "permission denied" error
- Verify RLS policies were created
- Make sure you're authenticated when testing

### "user_id column does not exist" error
- Ensure the UUID extension is enabled
- Check that auth.users table exists

## 📞 Support

If you encounter issues:
1. Check the Supabase Dashboard → Logs for errors
2. Verify your `.env.local` has correct Supabase credentials
3. Test with a simple INSERT query to verify permissions
