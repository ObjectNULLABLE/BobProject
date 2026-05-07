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
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres
   ```
5. Keep `SUPABASE_SERVICE_ROLE_KEY` private and do not expose it to client-side code.

   ```bash
   npm install
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

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
