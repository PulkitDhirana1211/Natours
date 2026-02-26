const dotenv = require('dotenv');
process.on('uncaughtException', err => {
    console.log('Uncaught Exception 💥 Shutting Down....');
    console.log(err);
    process.exit(1);
})
const app = require('./app');
const mongoose = require('mongoose');
dotenv.config({ path: './.env' })

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose.connect(DB)
    .then(() => console.log('DB Connection successful'));

const port = process.env.port || 3000;

const server = app.listen(port, () => {
    console.log(`App running on port ${port}...`);
})

process.on('unhandledRejection', err => {
    console.log('Unhandled Rejection 💥 Shutting Down....');
    console.log(err);
    server.close(() => {
        process.exit(1);
    })
})