const catchAsync = require("../utils/catchAsync");
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const AppError = require('../utils/appError');
const factory = require('../utils/handlerFactory');
const stripe = require('stripe');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    // Get the currently booked tour
    const { tourID } = req.params;
    const tour = await Tour.findById(tourID);
    const stripeObj = stripe(process.env.STRIPE_SECRET_KEY);

    // Create checkout session
    const session = await stripeObj.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        success_url: `${req.protocol}://${req.get('host')}/?tour=${tourID}&user=${req.user.id}&price=${tour.price}`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: tourID,
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    unit_amount: tour.price * 100,
                    product_data: {
                        name: `${tour.name} Tour`,
                        description: tour.summary,
                        images: [
                            `https://www.natours.dev/img/tours/${tour.imageCover}`,
                        ],
                    },
                },
                quantity: 1,
            },
        ],
    })
    // Create session as response
    res.status(200).json({
        status: "success",
        session
    })
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
    // Temporary as everyone can create booking without paying
    const { tour, user, price } = req.query;
    if (!tour && !user && !price) return next();
    await Booking.create({ tour, user, price });

    res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);