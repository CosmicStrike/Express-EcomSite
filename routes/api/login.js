import { Router } from "express";
import { config } from "dotenv";
import User from '../../models/user.js';
import { RandomString, SendEmail } from '../../utils.js'
import * as argon2 from "argon2";
import auth, { GenerateAccessToken, GenrateRefershToken } from "../../middlewares/auth.js";
const loginRouter = Router();

config();

// Stores the uid: Hash for email authentication
const AuthEmailHash = new Map();
const ResetPasswordHash = new Map();

const regexpEmail = /\b[A-Za-z0-9_.+-]+@[a-zA-Z0-9]+\.[a-zA-Z0-9]+\b/;
const regexpPassword = /(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{4,}/;// atleast four characters must be present with one alphabet,one number,one special character
const regexpMb = /\d{10}/


// Login
loginRouter.put('/login', async (req, res) => {
    /*
    Request Body:
        email: String,
        password: String
    */
    try {
        if (!regexpEmail.test(req.body.email)) return res.status(400).json({ status: false, message: 'Invalid email address' });
        if (!regexpPassword.test(req.body.password)) return res.status(400).json({ status: false, message: 'Password must contain atleast one alphabet, one number and one special character' });

        // Get the user
        const foundUser = await User.findOne({ email: req.body.email });

        //User not found
        if (!foundUser) return res.status(400).json({ success: false, message: 'User not found' });

        // Email is not verified
        if (!foundUser.emailVerified) return res.status(400).json({ success: false, message: 'Unauthorized User' });

        // Match the password
        if (!await argon2.verify(foundUser.password, req.body.password)) return res.status(200).json({ success: false, message: 'Invalid Password' });

        const authToken = JSON.stringify({ rt: await GenrateRefershToken(foundUser._id), at: GenerateAccessToken(foundUser._id) });

        res.setHeader('Set-Cookie', `${process.env.AUTH_COOKIE}=${authToken}; Secure; HttpOnly; Path=/; SameSite=Strict; Expires=${new Date(new Date().getTime() + parseInt(process.env.AUTH_COOKIE_EXPIRE))};`);
        return res.status(200).json({ success: true, message: 'Login Successful' });
    }
    catch (err) {
        console.log(err)
        return res.status(400).json({ success: false, message: 'Server failed to process the request' });
    }
});


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
        if (!regexpPassword.test(req.body.password)) return res.status(400).json({ status: false, message: 'Password must contain atleast one alphabet, one number and one special character' });
        if (!regexpMb.test(req.body.mobile)) return res.status(400).json({ success: false, message: 'Invalid mobile number' });

        // Check if email is registered previously or not
        let foundUser = await User.findOne({ email: req.body.email });

        if (foundUser && foundUser.emailVerified)
            return res.status(409).json({ success: false, message: 'User already exist' });

        if (foundUser && !foundUser.emailVerified) {
            // User is reattempting with same email
            foundUser.mobile = req.body.mobile;
        } else {
            // User not found 
            foundUser = new User({
                email: req.body.email,
                mobile: req.body.mobile,
            });
        }

        // TODO: Email Verification
        const hash = RandomString()
        const url = process.env.EMAIL_VERIFY_URL + `?token=${hash}&uid=${foundUser._id}`;

        if (await SendEmail(foundUser.email, url, 1)) {
            // Hash the passwprd only when eamil is send successfully
            foundUser.password = await argon2.hash(req.body.password);

            // Assign new hash to user, this will override the existing hash if present
            AuthEmailHash.set(foundUser._id.toString(), hash);
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
});


//Logout
loginRouter.put('/logout', auth, async (req, res) => {
    /*
    Request Contains:
        uid: String
    */
    try {
        const foundUser = await User.findById(req.uid);
        if (!foundUser) {
            // No such user Exists
            res.setHeader(`Set-Cookie`, `${process.env.AUTH_COOKIE}=${null}; Secure; HttpOnly; Path=/; SameSite=Strict; Expires=${new Date(null)}`);
            return res.status(401).json({ success: false, message: "No such User Exists; Unauthorized Access" });
        }

        //Found User; Remove the refresh token
        foundUser.refresh = null;
        await foundUser.save()
        // Delete/Expire the auth cookie
        res.setHeader(`Set-Cookie`, `${process.env.AUTH_COOKIE}=${null}; Secure; HttpOnly; Path=/; SameSite=Strict; Expires=${new Date(null)}`);
        return res.status(200).json({ success: true, message: 'User Logout Successfully' });
    }
    catch (err) {
        console.log(err)
        return res.status(400).json({ success: false, message: 'Server failed to process the request' });
    }
});


// Verify the email
loginRouter.put('/email/verify', async (req, res) => {
    /*
    Body of Request: 
        token: String,
        uid: String
    */

    try {
        const foundUser = await User.findById(req.body.uid);
        if (!foundUser) return res.status(400).json({ success: false, message: 'Invalid User' });

        const userId = foundUser._id.toString();
        if (foundUser.emailVerified) {
            // Delete the mapping in AuthEmail if present
            AuthEmailHash.delete(userId);
            return res.status(200).json({ success: false, message: 'Email is already verified' });
        }
        // Not verified
        if (!AuthEmailHash.has(userId)) return res.status(200).json({ success: false, message: 'Link is expired, Please register again' });

        // Verify the hash/token
        if (AuthEmailHash.get(userId) !== req.body.token) {
            return res.status(400).json({ success: false, message: 'Invalid token' });
        }

        // Email has been successfully verified
        foundUser.emailVerified = true;
        await foundUser.save();

        AuthEmailHash.delete(userId);// Remove after email verification
        return res.status(200).json({ success: true, message: 'Email Verified Successfully' });

    }
    catch (err) {
        console.log(err)
        return res.status(400).json({ success: false, message: 'Server failed to process the request' });
    }
});


// This will get the email and ckeck for validity and send an email of form for reseting the password.
loginRouter.put('/password/forgot', async (req, res) => {
    /**
     * Request body:
     *      email: String
     */
    try {
        if (!regexpEmail.test(req.body.email)) return res.status(400).json({ status: false, message: 'Invalid email address' });

        const foundUser = await User.findOne({ email: req.body.email });

        // User not found
        if (!foundUser) return res.status(400).json({ success: false, message: 'User not found' });

        // User found but email is not verified
        if (!foundUser.emailVerified) return res.status(400).json({ success: false, message: 'Unauthorized Email' });

        // User found and we have valid email address of the user
        const hash = RandomString();
        const url = process.env.RESET_PASSWORD_URL + `?token=${hash}&uid=${foundUser._id}`;

        if (await SendEmail(foundUser.email, url, 0)) {
            // Successfully send the email

            // Add new hash to this user , this hash will override the previous hash if present
            ResetPasswordHash.set(foundUser._id.toString(), hash);
            return res.status(200).json({ success: true, message: 'Reset Password Link is send successfully' });
        }
        else
            return res.status(200).json({ success: false, message: 'Failed, Please try again later' });

    }
    catch (err) {
        console.log(err);
        return res.status(400).json({ success: false, message: 'Server failed to process the request' });
    }
});

// This will accept the new password and accordingly modify it.
loginRouter.put('/password/reset', async (req, res) => {
    /**
     * Request body:
     *      uid: String,
     *      token: String
     *      resetPassword: String,
     */
    try {
        if (!regexpPassword.test(req.body.password)) return res.status(400).json({ status: false, message: 'Password must contain atleast one alphabet, one number and one special character' });

        const foundUser = await User.findById(req.body.uid);

        // User not found
        if (!foundUser) return res.status(400).json({ success: false, message: 'User not found' });

        // User found but email is not verified
        if (!foundUser.emailVerified) return res.status(400).json({ success: false, message: 'Unauthorized Email' });

        const userId = foundUser._id.toString();
        if (!ResetPasswordHash.has(userId)) return res.status(400).json({ success: false, message: 'Reset password link expired' });

        // Token verification
        if (ResetPasswordHash.get(userId) !== req.body.token) return res.status(400).json({ success: false, message: 'Invalid token' });

        // Now token is valid, so change the password of our user
        foundUser.password = await argon2.hash(req.body.resetPassword);
        await foundUser.save();

        // Remove the hash from the user
        ResetPasswordHash.delete(userId);
        return res.status(200).json({ success: true, message: 'Reset Password Successfully' });

    }
    catch (err) {
        console.log(err)
        return res.status(400).json({ success: false, message: 'Server failed to process the request' });
    }
});

// To check whether user is login or not
loginRouter.put('/refresh', auth, (req, res) => {
    try {
        // User is Authanticated
        return res.status(200).json({ message: "User is Authorized" })
    }
    catch (err) {
        console.log(err)
        return res.status(500).json({ message: 'failure' })
    }
});


export default loginRouter;