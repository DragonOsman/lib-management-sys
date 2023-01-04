const express = require("express");
const userRouter = express.Router();
const bodyParser = require("body-parser");
const User = require("../../models/users");
const passport = require("passport");
const authenticate = require("../../authenticate");
const cors = require("../cors");

userRouter.use(bodyParser.json());

// GET users listing
userRouter.options("*", cors.corsWithOptions, (req, res) => {
  res.sendStatus(200);
  res.setHeader("Access-Control-Allow-Credentials", "true");
});

userRouter.get("/", cors.corsWithOptions, authenticate.verifyUser,
  authenticate.verifyAdmin, (req, res, next) => {
    User.find({})
      .then((users) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(users);
      }, (err) => next(err))
      .catch((err) => next(err))
    ;
  })
;

userRouter.put("/:userId", cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  User.findByIdAndUpdate(req.params.userId, {
    $set: req.body
  }, { new: true })
    .then((user) => {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json(user);
    }, (err) => next(err))
    .catch((err) => res.status(400).json({ message: `error occurred: ${err}`, success: false }))
  ;
});

// For changing user's password
userRouter.put("/password/:userId", cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  User.findById(req.params.userId)
    .then((user) => {
      if (user && !user.admin) {
        user.setPassword(req.body.password, () => {
          user.save();
          res.status(200).json({ message: "Password changed succcessfully" });
        })
      } else if (!user) {
        res.status(500).json({ message: "User doesn't exist" });
      } else {
        res.status(400).json({
          message: "Password of an admin can't be changed this way.\nContact the webmaster"
        });
      }
    }, (err) => next(err))
    .catch((err) => res.status(400).json({ message: `Internal server error: ${err}` }))
  ;
});

userRouter.post("/signup", cors.corsWithOptions, (req, res, next) => {
  User.register(new User({
    username: req.body.username,
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    roll: req.body.roll
  }), req.body.password, (err, user) => {
    if (err) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.json({ err: err });
    } else {
      user.save((err, user) => {
        if (err) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.json({ err: err });
          return;
        }
        passport.authenticate("local")(req, res, () => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json({ success: true, status: "Registration Successful!" });
        });
      });
    }
  });
});

userRouter.post("/login", cors.corsWithOptions, passport.authenticate("local"), (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      res.statusCode = 401;
      res.setHeader("Content-Type", "application/json");
      res.json({ success: false, status: "Login Unsuccessful!", err: info });
    }
    req.logIn(user, (err) => {
      if (err) {
        res.statusCode = 401;
        res.setHeader("Content-Type", "application/json");
        res.json({ success: false, status: "Login Unsuccessful!", err: "Could not log in user!" });
      }

      const token = authenticate.getToken({ _id: req.user._id });
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json({ success: true, status: "Login Successful!", token: token, userinfo: req.user });
    });
  }) (req, res, next); // Function call IIFE
});

userRouter.get("/logout", cors.cors, (req, res, next) => {
  if (req.session) {
    req.session.destroy();
    res.clearCookie("session-id");
    res.redirect("/");
  } else {
    const err = new Error("You are not logged in!");
    err.status = 403;
    next(err);
  }
});

userRouter.get("/checkJWT", cors.corsWithOptions, (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      res.statusCode = 401;
      res.setHeader("Content-Type", "application/json");
      return res.json({ status: "JWT invalid!", success: false, err: info });
    } else {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      return res.json({ status: "JWT valid!", success: true, user: user });
    }
  })(req, res);
});

module.exports = userRouter;
