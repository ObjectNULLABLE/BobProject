# Band of Blades Game Tool

An online tool for preparing and running games based on the Band of Blades system using React and Next.js.

## Features

- **Session Management**: Create persistent game sessions that bind all content (characters, maps, dice rolls). Game Masters can create sessions, and players can join by ID.
- **Character Creation**: Create and manage commanders, soldiers, and specialists with full serialization.
- **Game Guidelines**: Hints and guidelines on Band of Blades mechanics and phases.
- **Interactive Canvas**: Upload maps and place tokens for your games.
- **Collaborative Rooms**: Create game sessions and invite players for real-time collaboration.
- **Dice Roller**: Roll dice adapted to Band of Blades mechanics.

## Setup

1. Create a [Supabase](https://supabase.com) project
2. Go to Settings > API to get your project URL and anon key
3. Go to Settings > Database to get your database connection string
4. Update `.env` with your Supabase credentials (replace the placeholder values):
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_actual_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres
   ```
5. Keep `SUPABASE_SERVICE_ROLE_KEY` private and do not expose it to client-side code.
6. Create the `sessions` table in Supabase SQL Editor:

   ```sql
   CREATE TABLE sessions (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name TEXT NOT NULL,
     owner TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     characters JSONB DEFAULT '[]'::jsonb,
     maps JSONB DEFAULT '[]'::jsonb,
     dice_history JSONB DEFAULT '[]'::jsonb
   );
   ```

7. Create the `session_members` table in Supabase SQL Editor:

   ```sql
   CREATE TABLE session_members (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
     role TEXT NOT NULL CHECK (role IN ('commander', 'marshal', 'quartermaster', 'lorekeeper', 'spymaster')),
     player_name TEXT NOT NULL,
     player_id UUID,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE(session_id, role)
   );
   ```

8. Grant permissions for the `session_members` table in Supabase SQL Editor:

   ```sql
   GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.session_members TO service_role;
   ```

9. Enable authentication in Supabase by going to Authentication > Users and setting up email/password auth.

10. Install dependencies and run the development server:

    ```bash
    npm install
    npm run dev
    ```

11. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

- **GM Authentication**: Go to [/auth](/auth) to create a GM account or sign in
- **Creating a Session**: As a Game Master, go to the home page and enter a session name (e.g., "Legion"). You'll receive a session ID to share with players
- **Joining a Session**: Players can go to [/session/[id]](/session/[id]) with a valid session ID to join
- **Selecting Your Role**: Upon joining, players select their legion role:
  - Commander
  - Marshal
  - Quartermaster
  - Lorekeeper
  - Spymaster

  Each role can only be selected by one player. Role selection is saved locally but can be changed anytime

## Architecture

- **Authentication**: Supabase Auth (email/password, extensible to Google OAuth)
- **Database**: PostgreSQL via Supabase with Row Level Security
- **Real-time**: Ready for Supabase real-time subscriptions for collaborative updates
- **State**: Zustand for local session state, localStorage for player role preferences

## Build

To build the project for production:

```bash
npm run build
```

## Technologies Used

- Next.js 15
- React 18
- TypeScript
- Tailwind CSS
- Supabase (database and real-time)
- Zustand (state management)
- ESLint
