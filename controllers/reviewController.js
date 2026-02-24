const Review = require("../models/reviewModel");
const AppError = require("../utils/appError");
const factory = require('./../utils/handlerFactory');

exports.setTourUserIds = (req, res, next) => {
    if (!req.body.tour) req.body.tour = req.params.tourID;
    if (!req.body.user) req.body.user = req.user.id;  // Coming from protect function
    next();
}

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);