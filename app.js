require('dotenv').config()
const dotenv=require('dotenv');


const express=require("express");
const bodyParser=require("body-parser");
const mongoose=require("mongoose");

const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
var GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy= require("passport-facebook").Strategy;
var LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;

const findOrCreate=require("mongoose-findOrCreate");



const app=express();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

app.use(session({
    secret:"Our little secret",
    resave:false,
    saveUninitialized:false,

}))

app.use(passport.initialize());
app.use(passport.session());



mongoose.connect("mongodb+srv://admin-pradhumna17:7777777p@cluster0.zlxyi.mongodb.net/ribodikoDB",{ useNewUrlParser:true});

const personSchema=new mongoose.Schema({
    
    fName:String,
    lName:String,
    pNumber:Number,
    email:String,
    username:{type:String,unique:true},
    password:String,
    provider:String
   
});

personSchema.plugin(passportLocalMongoose,{usernameField:"username"}); //hash and salt passwords and save user in db
personSchema.plugin(findOrCreate);
const Person=mongoose.model("Person",personSchema);
mongoose.set('useCreateIndex', true);
passport.use(Person.createStrategy());

passport.serializeUser(function(person, done) {
    done(null, person.id);
  });
  
  passport.deserializeUser(function(id, done) {
    Person.findById(
        id, function(err, person) {
      done(err, person);
    });
  });


//Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/ridobiko",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo" //if google+ api deprecates
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
      
    Person.findOrCreate(
        { username: profile.id },
        {
            provider:"google",
        email:profile._json.email
    },
    
    function (err, person) {
      return cb(err, person);
    });
    console.log("till find or create no problem");
  }
));

//Facebook Strategy
passport.use(new FacebookStrategy({
    clientID: process.env.APP_ID,
    clientSecret: process.env.APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/ridobiko",
    profileFields:["id","email"]
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
    Person.findOrCreate(    
        { username: profile.id },
        {
            provider:"facebook",
        email:profile._json.email
    }, 
    function (err, person) {
      return cb(err, person);
    });
    console.log("till find or create of facebook no problem");
  }
));


//Linkedin Strategy
passport.use(new LinkedInStrategy({
    clientID: process.env.LINKEDIN_KEY,
    clientSecret: process.env.LINKEDIN_SECRET,
    callbackURL: "http://localhost:3000/auth/linkedin/ridobiko",
    scope: ['r_emailaddress', 'r_liteprofile'],
    state:true
  }, 
//   function(accessToken, refreshToken, profile, done) {
//     // asynchronous verification, for effect...
//     process.nextTick(function () {
//       // To keep the example simple, the user's LinkedIn profile is returned to
//       // represent the logged-in user. In a typical application, you would want
//       // to associate the LinkedIn account with a user record in your database,
//       // and return that user instead.
//       return done(null, profile);
//     });
//   }
function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
  Person.findOrCreate(    
      { username: profile.id },
      {
          provider:"linkedin",
      email:profile.emails[0].value
  }, 
  function (err, person) {
    return cb(err, person);
  });
  console.log("till find or create of facebook no problem");
}
  ));


app.get("/",function (req,res) {
    res.sendFile(__dirname+"/index.html");
});


app.get('/failure',function (req,res) {
    res.sendFile(__dirname+"/failure.html");
})
app.get('/success',function (req,res) {
    res.sendFile(__dirname+"/success.html");
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile','email']})
  
  );

//for google
  app.get('/auth/google/ridobiko', 
  passport.authenticate('google', { failureRedirect: '/failure' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/success');

    console.log("till authgoogleridobiko no problem");
  });
  

  //for facebook
  app.get('/auth/facebook',
  passport.authenticate('facebook', { scope: ['email']}
  ));

  app.get('/auth/facebook/ridobiko',
  passport.authenticate('facebook', { failureRedirect: '/failure' }),
  function(req, res) {
    res.redirect('/success');
    console.log("till authfacebookridobiko no problem");
  });
 
  //for linkedin
  app.get('/auth/linkedin',
  passport.authenticate('linkedin'),
  function(req, res){
    // The request will be redirected to LinkedIn for authentication, so this
    // function will not be called.
  });
  app.get('/auth/linkedin/ridobiko', passport.authenticate('linkedin', {
    successRedirect: '/success',
    failureRedirect: '/failure'
  }));


// app.get("/register",function (req,res) {
//       if(req.isAuthenticated){
//                  console.log("Person authenticated")
//                  res.redirect('/success');
//              }else{
//               res.redirect('/failure');
//              }
    
// });


app.post("/",function (req,res) {  //passport-local-mongoose to register our user
   
 Person.register({username:req.body.email,pNumber:req.body.phoneNo,fName:req.body.fName,lName:req.body.lName},req.body.password,function (err,person) {
     
     if(err){
      res.redirect("/success");
   console.log(err);
       
     }else{
      passport.authenticate("local")(function (req,res) {            //to authentic the users
            
        Person.updateOne(
            {_id:person._id},
            {$set:{provider:"local",email:username}},
            res.redirect("/")

        );
         
                                   
      }
      
      );
     }
 });
 
});













app.listen(process.env.PORT||3000,function () {
    console.log("Server is listening on port 3000");
})