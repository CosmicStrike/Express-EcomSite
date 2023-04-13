import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';

var app = express();

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

export default app;
