# OG Chess Backend

OG Chess Backend is a progressive Node.js server built with **NestJS**, **TypeORM**, **PostgreSQL**, and **Socket.io**. It handles secure user authentication, game room matchmaking, real-time move validation (via `chess.js`), score rankings, and live gameplay WebSockets.

---

## Technology Stack

- **Framework**: NestJS (v11+)
- **Database**: PostgreSQL (managed via TypeORM)
- **WebSockets**: Socket.io
- **Auth**: JWT (JSON Web Tokens) with Passport strategies
- **Game Engine**: `chess.js` for secure server-side validation

---

## Prerequisites

Ensure you have the following installed:
- **Node.js** (v18 or higher recommended)
- **npm** (v10 or higher)
- **Docker** (optional, for local PostgreSQL containerization)

---

## Step-by-Step Local Setup

### 1. Clone the repository and install dependencies
Navigate to the backend directory and run:
```bash
npm install
```

### 2. Environment Variables Configuration
Create a `.env` file in the root of the `og-chess-backend` folder:
```env
# Application Port
PORT=3001

# PostgreSQL Database Connection
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=nest_db

# Authentication Secrets
JWT_SECRET=your-super-long-secret
JWT_ACCESS_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d
```

### 3. Spin up local PostgreSQL (Docker Compose)
If you don't have a PostgreSQL instance running locally, you can spin up the pre-configured container using Docker:
```bash
docker compose up -d
```
This container runs PostgreSQL on port `5432` with username/password as `postgres`.

### 4. Compile and Run the Server
Start the NestJS server in development watch mode:
```bash
npm run start:dev
```
The server will boot up and listen for requests on `http://localhost:3001`.

---

## Available Scripts

- **`npm run start:dev`**: Runs the application in development mode with hot-reloading.
- **`npm run build`**: Compiles the TypeScript code into JavaScript files in the `dist` directory.
- **`npm run start:prod`**: Runs the compiled project in production mode.
- **`npm run lint`**: Inspects all code for ESLint style and type safety issues.
- **`npm run test`**: Runs unit tests.

---

## Key Features & Endpoints

### REST HTTP Endpoints
- **Authentication (`/auth`)**:
  - `POST /auth/signup` - Register a new user.
  - `POST /auth/login` - Authorize credentials and retrieve access/refresh tokens.
  - `GET /auth/me` - Retrieve the profile of the current authenticated user.
- **Matchmaking / Rooms (`/rooms`)**:
  - `POST /rooms` - Host/create a new game room (select White, Black, or Random color).
  - `GET /rooms` - Fetch paginated and filterable game rooms.
  - `GET /rooms/:id` - Fetch room details (player entities, FEN position, game status).
- **Standings (`/leaderboard`)**:
  - `GET /leaderboard` - Fetch paginated standings of top players ranked by wins (1 point per win), supporting name/email filtering.

### Socket.io WebSockets Gateway
The gateway handles live event bindings:
- **`join-room`**: Connects the player to a room. Assigns them to their database-configured color, replays previous moves to restore current FEN state on reconnect, and triggers opponent warnings.
- **`move`**: Validates a move on the server. Checks if it's the player's turn, executes the move in `chess.js`, persists the move to the database, checks for checkmate/draw states, and broadcasts `move-made` to both players.
- **`resign`**: Ends the match instantly, updating the database record with the winner.
- **`offer-draw` / `accept-draw` / `decline-draw`**: Formal draw agreement flow between players.
