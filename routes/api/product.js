import Product from '../../models/product.js';
import { Router } from 'express';
import { config } from "dotenv";
import auth, { GenerateAccessToken, GenrateRefershToken } from "../../middlewares/auth.js";

const productRouter = Router();
config();

// Return/ Get all the products from the database
productRouter.get('/', async (req, res) => {
    try {

    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: 'Server failed to process the request' });
    }
});


export default productRouter;
