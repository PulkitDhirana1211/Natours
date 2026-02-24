const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewController = require('./../controllers/reviewController');
const reviewRoutes = require('./reviewRoutes');

const router = express.Router();

// router.param('id', tourController.checkID);
//     .post(authController.protect, authController.restrictTo('user'), reviewController.createReview)

// POST /tour/3434gfad34/reviews
// GET /tour/34343434/reviews/5fad2crt4ab32

// router.route('/:tourID/reviews')
//     .post(authController.protect, authController.restrictTo('user'), reviewController.createReview)

router.use('/:tourID/reviews', reviewRoutes);

router.route('/top-5-tours')
    .get(tourController.aliasTopTours, tourController.getAllTours)

router.route('/tour-stats')
    .get(tourController.getTourStats)

router.route('/monthly-plan/:year')
    .get(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide', 'guide'),
        tourController.getMonthlyPlan)

router.route('/tours-within/:distance/center/:latlng/unit/:unit')
    .get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit')
    .get(tourController.getDistances);

router.route('/')                    // We don't need to mention full route as we are using middleware for routing
    .get(tourController.getAllTours)
    .post(authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.createTour)       // Chain multiple middleware functions

router.route('/:id')
    .get(tourController.getTour)
    .patch(authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.uploadTourImages,
        tourController.resizeTourImages,
        tourController.updateTour)
    .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.deleteTour)

module.exports = router;