var express = require('express');
var session = require('express-session');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var nunjucks = require('nunjucks');

var index = require('./routes/index');

var app = express();

nunjucks.configure(__dirname + '/views', {
    autoescape: true,
    express: app,
    noCache: true,
    watch: true
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('html', nunjucks.configure);
app.set('view engine', 'html');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'secret_key',
    cookie: {
        maxAge: 1000 * 60 * 60 // 쿠키 유효기간 1시간
    },
    saveUninitialized: false,
    resave: true
}));

app.use('/', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : '오류가 발생했습니다. typ0@naver.com';

    // render the error page
    res.status(err.status || 500);
    res.session = null;
    res.render('error');
});

module.exports = app;
