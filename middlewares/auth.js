import jwt from 'jsonwebtoken'
import { config } from 'dotenv'
import { v4 as uuidv4 } from 'uuid'
import User from '../models/user.js'

const { sign, verify } = jwt;
config()

function GenerateAccessToken(uid) {
    try {
        return sign(
            {
                uid: uid
            },
            process.env.TOKEN_SECRET,
            {
                algorithm: 'HS256',
                jwtid: process.env.JWT_ID,
                expiresIn: process.env.ACCESS_EXPIRE
            }
        );
    }
    catch (err) {
        console.log(err)
        return null;// Null value is return
    }

}
async function GenrateRefershToken(uid) {
    try {
        let temp_uuid = uuidv4();
        // Find the new refresh id for the user
        while ((await User.find({ refresh: temp_uuid }, 'refresh')).length) temp_uuid = uuidv4();

        const foundUser = await User.findById(uid);
        // If user is not found; return null; i.e uid(User Id) is invaild
        if (!foundUser) return null;

        foundUser.refresh = temp_uuid;

        // Generate Refresh token
        const rt = sign(
            {
                uid: uid,
                rid: temp_uuid
            },
            process.env.TOKEN_SECRET,
            {
                algorithm: 'HS256',
                jwtid: process.env.JWT_ID,
                expiresIn: process.env.REFRESH_EXPIRE
            }
        );
        await foundUser.save();
        return rt;
    }
    catch (err) {
        console.log(err)
        return null;
    }
}


export default async function auth(req, res, next) {
    try {
        // Does user have the cookie
        const Cookie = req.cookies.empvskp;
        if (!Cookie) {
            // Authentication Cookie is not present; Logout the user
            return res.status(401).json({ success: false, message: 'Authentication cookie is not present' });
        }

        const token = JSON.parse(Cookie);

        // Verify Refresh token

        verify(token.rt, process.env.TOKEN_SECRET, { jwtid: process.env.JWT_ID }, async (err, rDecoded) => {
            if (err) {
                // Error occured; that mean refresh token is either invalid or expired; Delete the cookie; Logout user
                res.setheader('Set-Cookie', `${process.env.AUTH_COOKIE}=${null}; Secure; HttpOnly; Path=/; SameSite=Strict; Expires=${new Date(null)};`);
                return res.status(401).json({ success: false, message: 'Refresh Token is either invalid or expired' });
            }
            else {
                // Refresh token is vaild and it is still alive
                const rid = rDecoded.rid;// Refresh token
                const uid = rDecoded.uid;// User ID containing the given refresh token

                // Vaildate the User ID
                const userFound = await User.findById(uid);
                if (!userFound) {
                    // Either user id is not valid or user does not exist anymore; So delete the cookie
                    res.setheader('Set-Cookie', `${process.env.AUTH_COOKIE}=${null}; Secure; HttpOnly; SameSite=Strict; Path=/; Expires=${new Date(null)};`);
                    return res.status(401).json({ success: false, message: 'User does not exist' });
                }
                // Verify Access Token

                verify(token.at, process.env.TOKEN_SECRET, { jwtid: process.env.JWT_ID }, async (err, aDecoded) => {
                    if (err) {
                        // Access token is either invaild or expired

                        // Check the refresh token in cookie with the token in database
                        if (userFound.refresh !== rid) {
                            // There is miss match; Logout the user
                            userFound.refresh = "";
                            await userFound.save();
                            res.setheader('Set-Cookie', `${process.env.AUTH_COOKIE}=${null}; Secure; HttpOnly; SameSite=Strict; Path=/; Expires=${new Date(null)};`);
                            return res.status(401).json({ success: false, message: 'Re-Use of expired Refresh token' });
                        }

                        // Now refresh token is valid, So grant a new Access and Refresh token to user
                        const newAuth = JSON.stringify({ at: GenerateAccessToken(uid), rt: await GenrateRefershToken(uid) });
                        res.setHeader('Set-Cookie', `${process.env.AUTH_COOKIE}=${newAuth}; Secure; HttpOnly; SameSite=Strict; Path=/; Expires=${new Date(new Date().getTime() + parseInt(process.env.AUTH_COOKIE_EXPIRE))};`);
                        req.uid = uid;
                        next();
                    }
                    else {
                        // Access token is Valid and it is still alive
                        req.uid = uid;
                        next();
                    }
                })
            }
        })
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Server failed to authenticate the user' })
    }

}


export {
    GenerateAccessToken,
    GenrateRefershToken
}
