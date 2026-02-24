const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('./../utils/appError');
const Booking = require('../models/bookingModel');
const { title } = require('process');


exports.getOverview = catchAsync(async (req, res, next) => {
    // Get data from collection - Step 1
    const tours = await Tour.find();
    // Build template - Step 2
    // Render that template using data from step 1 - Step 3

    res.status(200).render('overview', {
        title: 'All tours',
        tours
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
        path: 'reviews',
        field: 'review rating user'
    });

    if (!tour) {
        return next(new AppError('There is no tour with that name', 404));
    }

    res.status(200).render('tour', {
        title: `${tour.name} Tour`,
        tour
    });
});

exports.getLoginForm = (req, res) => {
    res.status(200).render('login', {
        title: 'Log into your account'
    });
};

exports.getAccount = (req, res) => {
    res.status(200).render('account', {
        title: 'Your account'
    });
}

exports.getMyTours = catchAsync(async (req, res, next) => {
    // Find all bookings
    const bookings = await Booking.find({ user: req.user.id });
    // Find tours with returned IDs
    const tourIds = bookings.map(el => el.tour);
    const tours = await Tour.find({ _id: { $in: tourIds } });

    res.status(200).render('overview', {
        title: 'My Tours',
        tours
    });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
    const updatedUser = await User.findByIdAndUpdate(req.user.id, {
        name: req.body.name,
        email: req.body.email
    },
        {
            new: true,
            runValidators: true
        });
    console.log(req.body);
    res.status(200).render('account', {
        title: 'Your account',
        user: updatedUser
    });
});