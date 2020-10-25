const express = require('express');
const routes = express.Router();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const user = require('./model');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');

routes.use(bodyParser.urlencoded({ extended: true}));

routes.use(cookieParser('secret'));
routes.use(session({
    secret : 'secret',
    maxAge : 3600000,
    resave : true,
    saveUninitialized : true
}));
routes.use(passport.initialize());
routes.use(passport.session());

//After cookie-parser and session we use flash
routes.use(flash());
routes.use(function(req, res, next){
    res.locals.success_massage = req.flash('success_massage');
    res.locals.error_massage = req.flash('error_massage');
    res.locals.error = req.flash('error');
    next();
});

const checkAuthenticated = function(req, res, next){
    if(req.isAuthenticated()){
        res.set('Cache-control','no-cache, private, no-store, must-revalidate, post-check=0, pre-check=0');
        return next();
    }else{
        req.flash('error_massage', 'You Need to Login');
        res.redirect('login');
    }
}

mongoose.connect('mongodb://localhost:27017/userDB',{
    useNewUrlParser: true,useUnifiedTopology:true
}).then(()=>console.log('Database Connected'));

routes.get('/',(req,res)=>{
    res.render('index');
});

routes.post('/register',(req,res)=>{
    var  {username, email, password, confpassword} = req.body;
    var err;
    if(!username || !email || !password || !confpassword){
        err = 'Please Fill All The Fields'
        res.render('index',{err:err});
    }else if(password.length < 5){
        err = 'Password too short';
        res.render('index',{err:err,username:username,email:email});
    }else if(password != confpassword){
        err = "Password Don't Match"
        res.render('index',{err:err, username:username,email:email});
    }else{
        user.findOne({email:email},(err,data)=>{
            if(err) throw err;
            if(data){
                err = 'This Email Already Exists'
                res.render('index',{err:err, username:username,email:email});
            }else{
                bcrypt.genSalt(10,(err,salt)=>{
                    if(err) throw err;
                    bcrypt.hash(password,salt,(err,hash)=>{
                        if(err) throw err;
                        password = hash;
                        user({
                            username,
                            email,
                            password
                        }).save((err,data)=>{
                            if(err) throw err;
                            req.flash('success_massage', 'Registered Successfully... Login to Continue')
                            res.redirect('login');
                        });
                    });
                });
            }
        })
    }
});

//Authentication Strategy
var localStrategy = require('passport-local').Strategy;
passport.use(new localStrategy({usernameField:'email'}, (email, password, done)=>{
    user.findOne({email:email}, (err, data)=>{
        if(err) throw err;
        if(!data){
            return done(null, false, {message : "User Dosen't Exists..."});
        }
        bcrypt.compare(password,data.password, (err,match)=>{
            if(err){
                return done(null, false);
            }else if(!match){
                return done(null,false, {message : "Password Dosen't Match..."});
            }else{
                return done(null, data);
            }
        });        
    });
}));


passport.serializeUser(function(user, cb){
    cb(null, user.id);
});

passport.deserializeUser(function(id, cb){
    user.findById(id, function(err, user){
        cb(err, user);
    });
});


routes.get('/login',(req,res)=>{
    res.render('login');
});

routes.post('/login',(req,res,next)=>{
    passport.authenticate('local',{
        successRedirect:'/success',
        failureRedirect:'/login',
        failureFlash: true
    })(req,res,next);
});

routes.get('/success',checkAuthenticated, (req,res)=>{
    res.render('success',{user:req.user});
});

routes.get('/logout',(req,res)=>{
    req.logout();
    res.redirect('/login');
});

// routes.get('/addmsg', checkAuthenticated ,(req,res)=>{
//     res.redirect('success');
// });

routes.post('/addmsg', checkAuthenticated ,(req,res)=>{
    user.findOneAndUpdate(
        {email : req.user.email},
        { $push : {
            msg : req.body['msg']
        }},(err, suc)=>{
            if(err) throw err;
            if(suc) console.log('Add message Successfully....');
        }
    );
    res.redirect('success');
});
module.exports = routes;