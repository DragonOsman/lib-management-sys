const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bookRouter = express.Router();
const authenticate = require("../../authenticate");
const cors = require("../cors");
const Books = require("../../models/books");

bookRouter.use(bodyParser.json());

bookRouter.route("/")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.corsWithOptions, async (req, res) => {
    try {
      const books = await Books.find(req.query)
        .sort({ name: "asc" })
      ;
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json(books);
    } catch (err) {
      next(err);
    }
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin,
    async (req, res, next) => {
      try {
        const book = await Books.create(req.body);
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(book);
      } catch (err) {
        next(err);
      }
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end("PUT operation not supported on /books");
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end("DELETE operation not supported on /books");
  })
;

bookRouter.route("/:bookId")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  })
  .get(cors.corsWithOptions, async (req, res, next) => {
    try {
      const book = await Books.findById(req.params.bookId);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json(book);
    } catch (err) {
      next(err);
    }
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end(`POST operation not supported on /books/${req.params.bookId}`);
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin,
    async (req, res, next) => {
      try {
        const book = await Books.findByIdAndUpdate(req.params.bookId, {
          $set: req.body
        }, { new: true });
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(book);
      } catch (err) {
        next(err);
      }
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin,
    async (req, res, next) => {
      try {
        await Books.findByIdAndRemove(req.params.bookId);
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json({ _id: req.params.bookId, success: true })
      } catch (err) {
        next(err);
      }
  })
;

module.exports = bookRouter;
