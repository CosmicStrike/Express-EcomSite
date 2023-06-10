import Product from '../../models/product.js';
import { Router } from 'express';
import { config } from "dotenv";
import multer from 'multer';
import path from 'path'
import { db } from '../../app.js'
const productRouter = Router();
config();

const multerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        // first parameter is error if any and second parameter destination
        cb(null, 'public/products/');
    },
    filename: function (req, file, cb) {
        const ext = file.mimetype.split("/")[1];
        const fname = req.body.name + '-' + Date.now() + path.extname(file.originalname);
        cb(null, fname);
    }
})

const uploads = multer({
    storage: multerStorage,
    fileFilter(req, file, cb) {
        const ext = file.mimetype.split("/")[0];
        if (db.readyState !== 1) cb(new Error("Database Connection Loss"), false);
        if (ext !== "image") cb(new Error("Uploaded file is not an image"), false);
        cb(null, true);
    }
}).array("image", 5);

// Return/ Get all the products from the database
productRouter.get('/', async (req, res) => {
    try {
        const products = await Product.find({}, '_id name category price description imageUrls');
        res.status(200).json({ success: true, message: 'All products send successfully', products: products });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: 'Server failed to process the request' });
    }
});

productRouter.post('/', (req, res) => {
    /**
     *  Request body:
     *         1. name: String,
     *         2. price: Number,
     *         3. maxQuantity: Number,
     *         4. category: String
     *  Request File:
     *         1. file
     */
    try {
        if (db.readyState !== (1)) return res.status(400).json({ success: false, message: "Failed to create resourse" });

        uploads(req, res, async function (err) {
            if (err) {
                console.log(err);
                return res.status(400).json({ success: false, message: "Failed to create resourse " });
            }
            else {
                let urls = []
                req.files.forEach((file) => {
                    urls.push(process.env.STATIC_URL + '/' + "products" + '/' + file.filename)
                })
                const product = new Product({
                    name: req.body.name,
                    category: req.body.category,
                    maxQuantity: req.body.maxQuantity,
                    price: req.body.price,
                    imageUrls: urls,
                    images: req.files,
                    description: req.body.description,
                    createdAt: new Date()
                });
                await product.save();
                return res.status(201).json({ success: true, message: 'Resource created' });
            }
        });

    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: 'Server failed to process the request' });
    }
});


export default productRouter;
