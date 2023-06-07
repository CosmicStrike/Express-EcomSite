import mongoose from "mongoose";
const Schema = mongoose.Schema;

const productSchema = Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },

    category: {
        type: String,
    },

    price: {
        type: Number,
        default: 0
    },

    maxQuantity: {
        type: Number,
        default: 0
    },

    imageUrls: {
        type: [String],
        required: true
    },

    images: {
        type: [Object],
        required: true
    },

    createdAt: {
        type: Date,
        required: true
    }
})


export default mongoose.model("Product", productSchema);