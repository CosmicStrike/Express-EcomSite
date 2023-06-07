import { config } from 'dotenv'
import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import mongoose from 'mongoose';
import loginRouter from './routes/api/login.js';
import productRouter from './routes/api/product.js';
import userRouter from './routes/api/user.js';

const app = express();
config()

mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGOOSE_URL);
const db = mongoose.connection;
db.on('error', (err) => { console.log(err) });
db.once("open", () => console.log("Successfull connection to database"));

// CORS
app.use((req, res, next) => {
    res.header('Content-Type', 'application/json; charset=UTF-8');
    res.header('Access-Control-Allow-Credentials', true);//Credentials are cookies, authorization headers, or TLS client certificates.
    res.header('Access-Control-Allow-Methods', "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.header('Access-Control-Allow-Headers', "Origin, X-Requested-With, Content-Type, Accept");
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    next()
})


app.use(logger('dev'));// To log the request and their response eg: GET / 404 2.420 ms - 139
app.use(express.json());// Parse the stringified data from fetch request to json object
app.use(express.urlencoded({ extended: true }));
/* 
    Urlencoded: data send to server using forms is by default encoded using url-encoding which is of format x-www-form-urlencoded (it's Content-Type)
                we can also send such data using api just by changing content-type : application/json to x-www-form-urlencoded

    extended: false => uses query-string library for parsing, but that library cannot parse nested parameters send to server using forms/api call 
    extended: true => uses qs library for parsing, it can parse nested parameters into nested objects 
*/
app.use(cookieParser());// Handles the cookies send by client
app.use('/static', express.static('public'));// we can access the static files such as user images, css

app.use('/api/user', userRouter);
app.use('/api/product', productRouter);
app.use('/api', loginRouter);

export { db };
export default app;
