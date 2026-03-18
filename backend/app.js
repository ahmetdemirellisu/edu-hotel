require("dotenv").config();

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

// Routes
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var authRouter = require('./routes/auth');
var roomsRouter = require("./routes/rooms");
var adminRouter = require('./routes/admin');
var paymentRouter = require('./routes/payment'); 
var reservationsRouter = require('./routes/reservations');

var app = express();

// --- 1. MIDDLEWARE ---
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost', 'http://localhost:80', 'http://localhost:8004'],
    credentials: true
}));

app.use(logger('dev'));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));
app.use(cookieParser());

// --- 2. API ROUTES (HIGH PRIORITY) ---
// Registered before static files to prevent 404/HTML interception
app.use("/admin", adminRouter); 
app.use("/payment", paymentRouter); 
app.use('/auth', authRouter);
app.use('/reservations', reservationsRouter);
app.use("/blacklist", require("./routes/blacklist"));
app.use("/users", usersRouter);
app.use("/rooms", roomsRouter);
app.use("/notifications", require("./routes/notifications"));

// --- 3. STATIC FILE SERVING ---
const rootDir = path.join(__dirname, '..');
const requireAdmin = require('./middleware/requireAdmin');
const fs = require('fs');

// Receipt files are admin-only — strip path traversal and send directly
function serveReceipt(dir) {
    return [requireAdmin, (req, res) => {
        const filename = path.basename(req.path); // strips any ../ attempts
        const filepath = path.join(rootDir, dir, filename);
        if (!fs.existsSync(filepath)) return res.status(404).json({ error: "File not found." });
        res.sendFile(filepath);
    }];
}

app.use('/view-pending',  serveReceipt('paymentRecieptsPending'));
app.use('/view-approved', serveReceipt('paymentRecieptsAprooved'));

// Serving the public folder (CSS, images, etc.) inside the backend folder
app.use(express.static(path.join(__dirname, 'public')));

// --- 4. GENERAL ROUTES ---
app.use('/', indexRouter);

// --- 5. ERROR HANDLING (MUST BE LAST) ---
app.use(function(req, res, next) {
    res.status(404).json({ 
        error: "Route not found",
        path: req.originalUrl 
    });
});

module.exports = app;