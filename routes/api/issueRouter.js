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
    async (req, res, next) => {
      try {
        const issues = await Issue.find({})
          .populate("patron")
          .populate("book")
        ;
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(issues);
      } catch (err) {
        next(err);
      }
    }
  )
  .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin,
    async (req, res, next) => {
      try {
        const requiredBook = await Books.findById(req.body.book);
        try {
          const requiredUser = await Users.findById(req.body.patron);

          if (!requiredBook) {
            const error = new Error("Book doesn't exist");
            error.status = 400;
            return next(error);
          } else if (!requiredUser) {
            const error = new Error("Patron doesn't exist");
            error.status = 400;
            return next(error);
          } else if (requiredBook._id && requiredUser._id) {
            try {
              const issues = Issue.find({
                patron: req.body.patron
              });

              const notReturned = issues.filter(issue => !issue.returned);
              if (notReturned && notReturned.length >= 3) {
                const error = new Error(`The student has already issued 3 books.
                   Please return them first`)
                ;
                error.status = 400;
                return next(error);
              } else {
                if (requiredBook.copies > 0) {
                  try {
                    await Issue.create(req.body, (err, issue) => {
                      if (err) {
                        return next(err);
                      }

                      try {
                        Issue.findById(issue._id)
                          .populate("patron")
                          .populate("book")
                          .exec(async (err, issue) => {
                            if (err) {
                              return next(err);
                            }

                            try {
                              await Books.findByIdAndUpdate(req.body.book, {
                                $set: { copies: requiredBook.copies - 1 }
                              }, { new: true });
                              res.statusCode = 200;
                              res.setHeader("Content-Type", "application/json");
                              res.json(issue);
                            } catch (err) {
                              next(err);
                            }
                          });
                      } catch (err) {
                        next(err);
                      }
                    });
                  } catch (err) {
                    next(err);
                  }
                } else {
                  const err = new Error(`The book is not available.
                    You can wait for some days, until the book is
                    returned to library.`)
                  ;
                  err.status = 400;
                  next(err);
                }
              }
            } catch (err) {
              res.status(400).json({
                success: false,
                message: `error occurred: ${err}`
              });
              next(err);
            }
          }
        } catch (err) {
          next(err);
        }
      } catch (err) {
        next(err);
      }
    }
  )
  .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin,
    (req, res, next) => {
      res.statusCode = 403;
      res.end("PUT operation not supported on /issues");
    }
  )
  .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin,
    async (req, res, next) => {
      try {
        const resp = await Issue.remove({});
        console.log("Removed all issues");
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(resp);
      } catch (err) {
        next(err);
      }
    }
  )
;

issueRouter.route("/patron")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.corsWithOptions, authenticate.verifyUser, async (req, res, next) => {
    console.log(`\n\n\n Object ID ===== ${req.user._id}`);
    try {
      const issue = await Issue.find({ patron: req.user._id })
        .populate("patron")
        .populate("book")
      ;
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json(issue);
    } catch (err) {
      next(err);
    }
  }
);

issueRouter.route("/:issueId")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.corsWithOptions, authenticate.verifyUser, async (req, res, next) => {
    try {
      const issue = await Issue.findById(req.params.issueId)
        .populate("patron")
        .populate("book")
      ;

      if (issue && (issue.student._id === req.user._id || req.user.admin)) {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(issue);
      } else if (!issue) {
        const err = new Error("Issue not found");
        err.status = 401;
        return next(err);
      }
    } catch (err) {
      next(err);
    }
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
    async (req, res, next) => {
      try {
        const issue = await Issue.findById(req.params.issueId);

        try {
          await Books.findById(issue.book);
            try {
              const issue = await Issue.findByIdAndUpdate(req.params.issueId, {
                $set: { returned: true }
              }, { new: true })
                .populate("patron")
                .populate("book")
              ;
              try {
                  await Books.findByIdAndUpdate(issue.book, {
                    $set: { copies: requiredBook.copies + 1 }
                  }, { new: true });
                  res.statusCode = 200;
                  res.setHeader("Content-Type", "application/json");
                  res.json(issue);
                } catch (err) {
                  res.status(400).json({
                    success: false,
                    message: `Book not found; error: ${err}`
                  });
                  next(err);
                }
            } catch (err) {
              next(err);
            }
        } catch (err) {
          res.status(400).json({
            success: false,
            message: `Book not found; error: ${err}`
          });
          next(err);
        }
      } catch (err) {
        res.status(400).json({
          success: false,
          message: `Issue not found; error: ${err}`
        });
        next(err);
      }
    }
  )
;

module.exports = issueRouter;
