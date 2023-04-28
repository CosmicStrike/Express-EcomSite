import { Router } from 'express';
import User from '../../models/user.js';
import Product from '../../models/product.js';
import auth, { GenerateAccessToken, GenrateRefershToken } from "../../middlewares/auth.js";

const userRouter = Router();

// Get the cart of the authorizied user
userRouter.get('/cart', auth, (req, res) => {
    /**
     *  Request:
     *      uid: String
     */
    try {

    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: 'Server failed to process the request' });
    }
});


// Add the product into the cart of authorizied user 
userRouter.put('/cart', auth, (req, res) => {
    /**
     *  Request:
     *      uid: String
     */
    try {

    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: 'Server failed to process the request' });
    }
});


// Remove the product from the cart
userRouter.delete('/cart', auth, (req, res) => {
    /**
     *  Request:
     *      uid: String
     */
    try {

    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: 'Server failed to process the request' });
    }
});

export default userRouter;