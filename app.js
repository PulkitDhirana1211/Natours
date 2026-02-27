const path = require('path');
const express = require('express');
const morgan = require('morgan');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const bookingController = require('./controllers/bookingController');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const viewRouter = require('./routes/viewRoutes');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const app = express();

app.enable('trust proxy');
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));      // Static files

// Global Middlewares
app.use(cors());
// Allows all origins

app.options('*', cors());  // Pre flight phase for non simple requests like put, patch or delete
// app.options('/api/v1/tours/:id', cors()); 

// Set security HTTP headers
// app.use(helmet());
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: [
                    "'self'",
                    "https://api.mapbox.com",
                ],
                styleSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "https://api.mapbox.com",
                    "https://fonts.googleapis.com",
                ],
                fontSrc: [
                    "'self'",
                    "https://fonts.gstatic.com",
                    "data:",
                ],
                imgSrc: [
                    "'self'",
                    "data:",
                    "blob:",
                    "https://api.mapbox.com",
                    "https://*.mapbox.com",
                ],
                workerSrc: [
                    "'self'",
                    "blob:"
                ],
                connectSrc: [
                    "'self'",
                    "https://api.mapbox.com",
                    "https://events.mapbox.com",
                    "ws://127.0.0.1:*",
                    "ws://localhost:*",
                ]
            }
        }
    })
);

// Development logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Limit requests from same IP
const limiter = rateLimit({
    max: 20,
    windowMs: 24 * 60 * 60,
    message: 'Too many requests on this IP. Please try again in an hour!'
})

app.use('/api', limiter);

app.post('/webhook-checkout', express.raw({ type: 'application/json' }), bookingController.webhookCheckout);
// Body parser, reading data from body into req.body 
app.use(express.json({ limit: '10kb' }));  // Middleware
app.use(express.urlencoded({ extended: true, limit: '10kb' }))
app.use(cookieParser());

// **Parses incoming JSON payloads** from request bodies
// Makes the parsed data available on `req.body`
// Runs on every incoming request because it's registered with `app.use()`

// Data sanitize against NoSQL query injection
app.use(mongoSanitize());

// Data sanitize against XSS
app.use(xss());


// Safe production use:
// app.use(cors({
//     origin: "https://www.example.com"
// }))

// Prevent parameter pollution
app.use(hpp({
    whitelist: ['duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price']
}));

app.use(compression());

// Test middlewares
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    // console.log(req.cookies);
    next();
})

// 3) Routes
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter); // Middleware for using tour Route (Mounting the router)
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.get('/.well-known/*', (req, res) => res.status(204).end());
app.get('*.map', (req, res) => res.status(204).end());

app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
})

app.use(globalErrorHandler);

// 4) Start the server

module.exports = app;