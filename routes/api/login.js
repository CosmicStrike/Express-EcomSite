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
        if (!foundUser.emailVerified) return res.status(200).json({ success: false, message: 'Verify the email before login' });

        // Match the password
        if (!await argon2.verify(foundUser.password, req.body.password)) return res.status(200).json({ success: false, message: 'Invalid Password' });

        const authToken = JSON.stringify({ rt: await GenrateRefershToken(foundUser._id), at: GenerateAccessToken(foundUser._id) });
        console.log(authToken)
        res.setHeader('Set-Cookie', `${process.env.AUTH_COOKIE}=${authToken}; Secure; HttpOnly; Path=/; SameSite=Strict; Expires=${new Date(new Date().getTime() + parseInt(process.env.AUTH_COOKIE_EXPIRE))};`);
        return res.status(200).json({ success: true, message: 'Login Successful' });
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
        if (!regexpPassword.test(req.body.password)) return res.status(400).json({ status: false, message: 'Password must contain atleast one alphabet, one number and one special character' });
        if (!regexpMb.test(req.body.mobile)) return res.status(400).json({ success: false, message: 'Invalid mobile number' });

        // Check if email is registered previously or not
        let foundUser = await User.findOne({ email: req.body.email });

        if (foundUser && foundUser.emailVerified)
            return res.status(409).json({ success: false, message: 'User already exist' });

        if (foundUser && !foundUser.emailVerified) {
            // User is reattempting with same email
            foundUser.mobile = req.body.mobile;

            // Remove the previous assign hash value of the user; if it is present
            AuthEmailHash.delete(foundUser._id.toString());
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

            // Set the mapping of hash and user
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
})


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
})


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