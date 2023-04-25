import { Router } from "express";
import { config } from "dotenv";
import User from '../../models/user.js';
import { v4 as uuid } from 'uuid';
import { RandomString, SendEmail } from '../../utils.js'
const loginRouter = Router();
config();

// Stores the uid: Hash for email authentication
const AuthEmailHash = new Map();

const regexpEmail = /\b[A-Za-z0-9_.+-]+@[a-zA-Z0-9]+\.[a-zA-Z0-9]+\b/;
const regexpPassword = /(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{4,}/;// atleast four characters must be present with one alphabet,one number,one special character

// Login
loginRouter.put('/login', async (req, res) => {
    try {

    }
    catch (err) {
        console.log(err)
        return res.status(400).json({ success: false, message: 'Server failed to process the request' });
    }
})


// Register
loginRouter.post('/register', async (req, res) => {
    /*
        input from client - 
            email: String,
            mobile: String, (Mobile Number),
            password: String
    */

    try {
        // Check the pattern of passwrod and email
        if (!regexpEmail.test(req.body.email)) return res.status(400).json({ status: false, message: 'Invalid email address' });
        if (!regexpPassword.test(req.body.password)) return res.status(400).json({ status: false, message: 'Password must contain atleast one alphabet, one number and one special character' })

        // Check if email is registered previously or not
        let foundUser = await User.findOne({ email: req.body.email });

        if (foundUser && foundUser.emailVerified)
            return res.status(409).json({ success: false, message: 'User already exist' });

        if (foundUser && !foundUser.emailVerified) {
            // User is reattempting with same email
            foundUser.password = req.body.password;
            foundUser.mobile = req.body.mobile;

            // Remove the previous assign hash value of the user; if it is present
            AuthEmailHash.delete(foundUser._id);
        } else {
            // User not found 
            foundUser = new User({
                email: req.body.email,
                mobile: req.body.mobile,
                password: req.body.password
            });
        }
        // Validate the fields using validators; throws error of not valid
        const error = foundUser.validateSync();
        if (error) return res.status(400).json({ success: false, message: `Invalid User Input` });

        // TODO: Email Verification
        const hash = RandomString()
        const url = process.env.EMAIL_VERIFY_URL + `?token=${hash}&id=${foundUser._id}`;

        if (await SendEmail(foundUser.email, url, 1)) {

            // Set the mapping of hash and user
            AuthEmailHash.set(foundUser._id, hash);
            await foundUser.save();
            return res.status(201).json({ success: true, message: 'New User Account is created' });
        }
        else
            return res.status(400).json({ success: false, message: 'Failed to send verification email' });
    }
    catch (err) {
        console.log(err)
        return res.status(400).json({ success: false, message: 'Server failed to process the request' });
    }
})


//Logout
loginRouter.put('/logout', (req, res) => {
    try {

    }
    catch (err) {
        console.log(err)
        return res.status(400).json({ success: false, message: 'Server failed to process the request' });
    }
})


// Verify the email
loginRouter.put('/email/verify', (req, res) => {
    try {

    }
    catch (err) {
        console.log(err)
        return res.status(400).json({ success: false, message: 'Server failed to process the request' });
    }
})


// Forgot Password
loginRouter.put('/password/reset', (req, res) => {
    try {

    }
    catch (err) {
        console.log(err)
        return res.status(400).json({ success: false, message: 'Server failed to process the request' });
    }
})


export default loginRouter;