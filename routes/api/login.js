import { Router } from "express";
import { config } from "dotenv";
import User from '../../models/user.js';
import { v4 as uuid } from 'uuid';
const loginRouter = Router();
config();

// Stores the uid: Hash for email authentication
const AuthEmailHash = new Map();


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
        // Check if email is registered previously or not
        let foundUser = await User.findOne({ email: req.body.email });

        if (foundUser && foundUser.emailVerified)
            return res.status(409).json({ success: false, message: 'User already exist' });

        if (foundUser && !foundUser.emailVerified) {
            // User is reattempting with same email
            foundUser.password = req.body.password;
            foundUser.mobile = req.body.mobile;

            // Remove the previous asign hash value to user; if it is present
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

        await foundUser.save();
        return res.status(201).json({ success: true, message: 'New User Account is created', user: foundUser });
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
        return res.status(400).json({ success: false, message: 'Server failed to process the request' });
    }
})


// Verify the email
loginRouter.put('/verify', (req, res) => {
    try {

    }
    catch (err) {
        return res.status(400).json({ success: false, message: 'Server failed to process the request' });
    }
})


// Forgot Password


export default loginRouter;