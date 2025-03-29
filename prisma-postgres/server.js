const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const session = require('express-session');
const path = require('path');

const prisma = new PrismaClient();
const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));
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
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
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

    res.json({ username: user.username, xp: user.xp, games: user.games });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
