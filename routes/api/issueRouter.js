const express = require("express");
const bodyParser = require("body-parser");
const issueRouter = express.Router();
const mongoose = require("mongoose");

const Books = require("../../models/books");
const Users = require("../../models/users");
const Issue = require("../../models/issues");

const passport = require("passport");
const authenticate = require("../../authenticate");

const cors = require("../../cors");

issueRouter.use(bodyParser.json({ extended: false }));

issueRouter.route("/")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin,
    (req, res, next) => {
      Issue.find({})
        .populate("patron")
        .populate("book")
        .then(issues => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(issues);
        }, err => next(err))
        .catch(err => next(err))
      ;
    }
  )
  .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin,
    (req, res, next) => {
      Books.findById(req.body.book)
        .then(requiredBook => {
          Users.findById(req.body.patron)
            .then(requiredUser => {
              if (!requiredBook) {
                const err = new Error("Book doesn't exist");
                err.status = 400;
                return next(err);
              } else if (!requiredUser) {
                const err = new Error("Patron doesn't exist");
                err.status = 400;
                return next(err);
              } else if (requiredBook._id && requiredUser._id) {
                Issue.find({ patron: req.body.patron })
                  .then(issues => {
                    const notReturned = issues.filter(issue => !issue.returned);
                    if (notReturned && notReturned.length >= 3) {
                      const err = new Error(`The patron has already issued 3 books.
                                             Please return them first`);
                      err.status = 400;
                      return next(err);
                    } else {
                      if (requiredBook.copies > 0) {
                        Issue.create(req.body, (err, issue) => {
                          if (err) {
                            return next(err);
                          }

                          Issue.findById(issue._id)
                            .populate("patron")
                            .populate("book")
                            .exec((err, issue) => {
                              if (err) {
                                return next(err);
                              }

                              Books.findByIdAndUpdate(req.body.book, {
                                $set: { copies: (requiredBook.copies - 1) }
                              }, { new: true })
                                .then(book => {
                                  res.statusCode = 200;
                                  res.setHeader("Content-Type", "application/json");
                                  res.json(issue);
                                }, err => next(err))
                                .catch(err => res.status(400).json({success: false, error: `${err}`}))
                              ;
                            });
                        });
                      } else {
                        console.log(requiredBook);
                        const err = new Error(`The book is not available.
                        You can wait for some days, until the book is returned to library.`);
                        err.status = 400;
                        return next(err);
                      }
                    }
                  })
                  .catch(err => next(err)
                );
              }
            }, err => next(err))
            .catch(err => next(err)
          );
        }, err => next(err))
        .catch(err => next(err)
      );
    }
  )
  .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin,
    (req, res, next) => {
      res.statusCode = 403;
      res.end("PUT operation not supported on /issues");
    }
  )
  .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin,
    (req, res, next) => {
      Issue.remove({})
        .then(resp => {
          console.log("Removed all issues");
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(resp);
        }, err => next(err))
        .catch(err => next(err))
      ;
    }
  )
;

issueRouter.route("/patron")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    console.log(`\n\n\n Object ID ===== ${req.user._id}`);
    Issue.find({ patron: req.user._id })
      .populate("patron")
      .populate("book")
      .then(issue => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(issue);
      }, err => next(err))
      .catch(err => next(err))
    ;
  }
);

issueRouter.route("/:issueId")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Issue.findById(req.params.issueId)
      .populate("patron")
      .populate("book")
      .then(issue => {
        if (issue && (issue.student._id === req.user._id || req.user.admin)) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(issue);
        } else if (!issue) {
          const err = new Error("Issue not found");
          err.status = 401;
          return next(err);
        }
      }, err => next(err))
      .catch(err => next(err))
    ;
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin,
    (req, res, next) => {
      res.statusCode = 403;
      res.end(`POST operation not supported on /issues/${req.params.issueId}`);
    }
  )
  .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin,
    (req, res, next) => {
      res.statusCode = 403;
      res.end(`DELETE operation not supported on /issues/${req.params.issueId}`);
    }
  )
  .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin,
    (req, res, next) => {
      Issue.findById(req.params.issueId)
        .then(issue => {
          Books.findById(issue.book)
            .then(requiredBook => {
              Issue.findByIdAndUpdate(req.params.issueId, {
                $set: { returned: true }
              }, { new: true })
                .populate("patron")
                .populate("book")
                .then(issue => {
                  Books.findByIdAndUpdate(issue.book, {
                    $set: { copies: requiredBook.copies + 1 }
                  }, { new: true })
                    .then(book => {
                      res.statusCode = 200;
                      res.setHeader("Content-Type", "application/json");
                      res.json(issue);
                    }, err => next(err))
                    .catch(err => res.statusCode(400).json({
                      success: false, message: `${err}. Book not updated`
                    }))
                  ;
                }, err => next(err))
                .catch(err => res.statusCode(400).json({
                  success: false, message: `${err}. Issue not updated`
                }))
              ;
            }, err =>  next(err))
            .catch(err => res.statusCode(400).json({
              success: false, message: `${err}. Book not found`
            }))
          ;
        }, err => next(err))
        .catch(err => res.statusCode(400).json({
          success: false, message: `${err}. Issue not found`
        }))
      ;
    }
  )
;

module.exports = issueRouter;
