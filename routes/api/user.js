import { Router } from 'express';
import User from '../../models/user.js';
import Product from '../../models/product.js';
import auth, { GenerateAccessToken, GenrateRefershToken } from "../../middlewares/auth.js";

const userRouter = Router();

// Get the cart of the authorizied user
userRouter.get('/cart', auth, async (req, res) => {
    /**
     *  Request:
     *      uid: String
     */
    try {
        const user = await User.findById(req.uid);
        console.log(user.cart);
        return res.status(200).json({ success: true, message: 'User Cart' });
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
     * 
     *  Request Body:
     *      pid: String
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
     * 
     *  Request Body:
     *      pid: String
     */
    try {

    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: 'Server failed to process the request' });
    }
});

// Return the cart history of the user
userRouter.get('/history', auth, async (req, res) => {
    /**
    *  Request:
    *      uid: String
    *      
    */
    try {
        const user = await User.findById(req.uid);
        
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: 'Server failed to process the request' });
    }
});

export default userRouter;