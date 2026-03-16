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
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
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
// FIX: Defining rootDir to point to the project root (one level up from /backend)
const rootDir = path.join(__dirname, '..'); 

// Serving the PDF receipt folders using the defined rootDir
app.use('/view-pending', express.static(path.join(rootDir, 'paymentRecieptsPending')));
app.use('/view-approved', express.static(path.join(rootDir, 'paymentRecieptsAprooved')));

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