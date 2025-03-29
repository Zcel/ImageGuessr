// Load environment variables from .env file
require('dotenv').config();

// Import required modules
const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const session = require('express-session');

// Initialize Prisma Client
const prisma = new PrismaClient();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key', // Use environment variable for session secret
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' } // Set secure cookies in production
}));

// Route to serve the homepage
app.get('/', (req, res) => {
  res.send('<h1>Welcome to the Image Guessing Game</h1><a href="/login">Login</a> | <a href="/register">Register</a>');
});

// Registration Route
app.get('/register', (req, res) => {
  res.send(`
    <h1>Register</h1>
    <form action="/register" method="POST">
      <input type="text" name="username" placeholder="Username" required><br>
      <input type="email" name="email" placeholder="Email" required><br>
      <input type="password" name="password" placeholder="Password" required><br>
      <button type="submit">Register</button>
    </form>
  `);
});

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    return res.status(400).send('User with this email already exists');
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new user
  const newUser = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash: hashedPassword
    }
  });

  req.session.userId = newUser.id;  // Save user session
  res.redirect('/dashboard');  // Redirect to the dashboard after successful registration
});

// Login Route
app.get('/login', (req, res) => {
  res.send(`
    <h1>Login</h1>
    <form action="/login" method="POST">
      <input type="email" name="email" placeholder="Email" required><br>
      <input type="password" name="password" placeholder="Password" required><br>
      <button type="submit">Login</button>
    </form>
  `);
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    return res.status(400).send('User not found');
  }

  // Compare hashed password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    return res.status(400).send('Invalid password');
  }

  // Save user session
  req.session.userId = user.id;

  res.redirect('/dashboard');
});

app.get('/dashboard', async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  // Get user data
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    include: { games: true, guesses: true }
  });

  if (!user) {
    return res.redirect('/logout'); // Logout if user not found
  }

  let gamesList = user.games.map(game => `<li>Game #${game.id} - <a href="/game/${game.id}">View</a></li>`).join('');

  res.send(`
    <h1>Welcome, ${user.username}!</h1>
    <p>XP: ${user.xp}</p>

    <h2>Your Games</h2>
    <ul>${gamesList || '<p>No games started yet.</p>'}</ul>
    
    <a href="/game/start"><button>Start New Game</button></a>
    <a href="/leaderboard"><button>View Leaderboard</button></a>
    <br><br>
    <a href="/logout"><button>Logout</button></a>
  `);
});

// Logout Route
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');  // Redirect to homepage after logging out
  });
});

// Start a new game
app.post('/game/start', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "You must be logged in to start a game" });
  }

  const { imageUrl, locationLat, locationLng, hints } = req.body;

  // Validate if all necessary fields are provided
  if (!imageUrl || !locationLat || !locationLng || !hints) {
    return res.status(400).json({ message: "Missing required game data" });
  }

  try {
    const newGame = await prisma.game.create({
      data: {
        creatorId: req.session.userId,
        imageUrl,
        locationLat,
        locationLng,
        hints
      }
    });
    console.log("New Game ID:", newGame.id); // Debugging line

    res.json({ message: "Game started!", gameId: newGame.id });
    window.location.href = `/game/${newGame.id}`;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error starting game" });
  }
});

// Submit a guess
app.post('/game/guess', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "You must be logged in to guess" });
  }

  const { gameId, guessLat, guessLng, timeTaken } = req.body;

  try {
    const game = await prisma.game.findUnique({ where: { id: gameId } });

    if (!game) return res.status(404).json({ message: "Game not found" });

    // Calculate distance-based score (simplified example)
          // Calculate distance-based score (simplified example)
          const distance = Math.sqrt(
            Math.pow(game.locationLat - guessLat, 2) +
            Math.pow(game.locationLng - guessLng, 2)
          );
          const score = Math.max(1000 - distance * 100, 0);
    
          await prisma.guess.create({
            data: {
              gameId,
              playerId: req.session.userId,
              guessLat,
              guessLng,
              score: Math.round(score),
              timeTaken
            }
          });
    
          // Update XP
          await prisma.user.update({
            where: { id: req.session.userId },
            data: { xp: { increment: Math.round(score) } }
          });
    
          res.json({ message: "Guess submitted!", score: Math.round(score) });
        } catch (error) {
          console.error(error);
          res.status(500).json({ message: "Error submitting guess" });
        }
      }
    );
    
    // Get a game's details
    app.get('/game/:id', async (req, res) => {
      const { id } = req.params;

      // Ensure the id is parsed as an integer
      const gameId = parseInt(id, 10);

      if (isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }

      console.log("Game ID from request params:", id);

      try {
        const game = await prisma.game.findUnique({
          where: { id: gameId },
          include: { guesses: true }
        });

        if (!game) {
          return res.status(404).json({ message: "Game not found" });
        }

        res.json(game);
      } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ message: "Error fetching game data" });
      }
    });
    
    // Get leaderboard
    app.get('/leaderboard', async (req, res) => {
      try {
        const leaderboard = await prisma.user.findMany({
          select: { username: true, xp: true },
          orderBy: { xp: "desc" }
        });
    
        res.json(leaderboard);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching leaderboard" });
      }
    });
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}/`);
    });
