var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const adminRouter = require('./routes/admin');
const HRRouter = require('./routes/HR');

var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req,res,next) => {
  console.log('req');
  const projekatCookie = req.cookies?.opkn

  if(req.path === '/users/login' || req.path === '/users/login_user') {
    return next();
  }
  if(projekatCookie) {
    const userData = projekatCookie;
    console.log(userData);
    const email = userData.email;
    const password = userData.lozinka;
    const admn = userData.jeliadmin;
    const hr = userData.jelihr;

    console.log("userData: ", userData);
    console.log("email: ", userData.email);
    console.log("password: ", userData.lozinka);
    console.log("admin?:  ", userData.jeliadmin);
    console.log("admin?:  ", userData.jelihr);

    res.userData = userData;

    return next();
  }
  else{
    //return res.render('index',  {title: 'User does not exist'});
    return next();
  }
})

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/admin', adminRouter);
app.use('/HR', HRRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
