require("dotenv").config();

var reservationsRouter = require('./routes/reservations');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');           // ⬅️ add this

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var authRouter = require('./routes/auth');
var roomsRouter = require("./routes/rooms");
var adminRouter = require('./routes/admin');

var app = express();

// 🔓 allow frontend on 5173
app.use(cors({
    origin: 'http://localhost:5173',
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/reservations', reservationsRouter);
app.use("/blacklist", require("./routes/blacklist"));
app.use("/users", require("./routes/users"));
app.use("/rooms", roomsRouter);
app.use("/admin", adminRouter);



module.exports = app;
