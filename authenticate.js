const passport = require("passport");
const LocalStratey = require("passport-local").Strategy;
const User = require("./models/users");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").Strategy;
const jwt = require("jsonwebtoken");

require("dotenv").config();

exports.local = passport.use(new LocalStrategy(User.authenticate()));

// For sessions
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

exports.getToken = (user) => {
  return jwt.sign(user, process.env.CLIENT_SECRET,
    { expiresIn: 3600 });
};

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.CLIENT_SECRET;

exports.jwtPassport = passport.use(new JwtStrategy(opts,
  (jwt_payload, done) => {
    console.log(`JWT payload: ${jwt_payload}`);
    User.findOne({ _id: jwt_payload._id }, (err, user) => {
      if (err) {
        return done(err, false);
      } else if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    });
  })
);

exports.verifyUser = passport.authenticate("jwt", { session: false });

exports.verifyAdmin = (req, res, next) => {
  if (req.user.admin) {
    next();
  } else {
    const err = new Error("You are not authorized!");
    err.status = 403;
    return next(err);
  }
};
