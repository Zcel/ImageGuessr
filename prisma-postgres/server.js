const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const session = require('express-session');
const path = require('path');

const prisma = new PrismaClient();
const app = express();
const PORT = 3000;

const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const storage = multer.diskStorage({
    destination: "public/uploads/",
    filename: (req, file, cb) => {
        cb(null, uuidv4() + path.extname(file.originalname)); // Unique image filename
    }
});
const upload = multer({ storage });

app.use(express.static(path.join(__dirname, 'public')));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Serve Login Page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Serve Register Page
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Registration Route
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
        data: {
            username,
            email,
            passwordHash: hashedPassword,
            xp: 0
        }
    });

    req.session.userId = newUser.id;
    res.json({ message: "Registration successful!", redirect: "/dashboard.html" });
});

// Login Route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        return res.status(400).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid password" });
    }

    req.session.userId = user.id;
    res.json({ message: "Login successful!", redirect: "/dashboard.html" });
});

// Logout Route
app.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: "Logout failed" });
        }
        res.json({ message: "Logged out successfully" });
    });
});


// Dashboard Data (Fetch User Info)
app.get('/user-data', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
        where: { id: req.session.userId },
        include: { games: true }
    });

    // ✅ Parse hints from JSON before sending response
    user.games = user.games.map(game => ({
        ...game,
        hints: JSON.parse(game.hints) // Convert string back to array
    }));

    res.json({ username: user.username, xp: user.xp, games: user.games });
});


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
//Handle game creation
app.post("/create-game", upload.single("image"), async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });

    const { latitude, longitude, hint1, hint2, hint3 } = req.body;
    const gameCode = uuidv4().slice(0, 6);

    try {
        const imageUrl = `/uploads/${req.file.filename}`;
        const newGame = await prisma.game.create({
            data: {
                creator: { connect: { id: req.session.userId } },
                imageUrl,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                gameCode,
                hints: JSON.stringify([hint1, hint2, hint3])
            }
        });

        return res.json({ message: "Game created!", gameCode: newGame.gameCode });
    } catch (error) {
        console.error("Error creating game:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


//Handle game joining
app.get("/join-game/:gameCode", async (req, res) => {
    const { gameCode } = req.params;

    try {
        const game = await prisma.game.findFirst({ where: { gameCode } });

        if (!game) {
            return res.status(404).json({ message: "Game not found" });
        }

        if (game.userId === req.session.userId) {
            return res.status(403).json({ message: "You cannot join your own game" });
        }

        res.json({
            message: "Joining game...",
            redirect: `/play-game.html?gameCode=${gameCode}`,
            imageUrl: game.imageUrl,
            latitude: game.latitude,
            longitude: game.longitude,
            hints: JSON.parse(game.hints)
        });
    } catch (error) {
        console.error("Error joining game:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
// Fetch game data by game code
app.get('/game-data/:gameCode', async (req, res) => {
    const { gameCode } = req.params;

    try {
        const game = await prisma.game.findFirst({
            where: { gameCode }
        });

        if (!game) {
            return res.status(404).json({ message: "Game not found" });
        }

        res.json({
            imageUrl: game.imageUrl,
            latitude: game.latitude,
            longitude: game.longitude,
            hints: game.hints
        });
    } catch (error) {
        console.error("Error fetching game data:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});