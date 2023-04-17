import mongoose from "mongoose";
const Schema = mongoose.Model;
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
        type: Number
    },

    createdAt: {
        type: Date,
        default: new Date()
    }

})


export default mongoose.model("Product", productSchema);