import mongoose from "mongoose";
const Schema = mongoose.Schema;

const userSchema = Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },

    password: {
        type: String,
        required: true,
    },

    firstname: {
        type: String,
        minLength: [3, 'Must be atleast 3 characters, but got ${VALUE}'],
        maxLength: [20, 'Must be atmost 20 characters, but got ${VALUE}']
    },

    lastname: {
        type: String,
        minLength: [3, 'Must be atleast 3 characters, but got ${VALUE}'],
        maxLength: [20, 'Must be atmost 20 characters, but got ${VALUE}']
    },

    address: {
        type: String,
        maxLength: [40, 'Must be atmost 40 characters, but got ${VALUE}']
    },

    mobile: {
        type: String,
        maxLength: [10, 'Mobile number has more than 10 characters'],
        vaildate: {
            validator: function (mb) {
                let regexp = new RegExp('/^\d{10}$/');
                return regexp.test(mb);
            },
            message: "Invalid Mobile Number"
        }
    },

    country: {
        type: String,
        minLength: [4, 'Must be atleast 4 characters, but got less than 4'],
        maxLength: [56, 'Must bt atmost 56 characters, but got more than 56']
    },

    emailVerified: {
        type: Boolean,
        default: false,
    }
});

export default mongoose.model("User", userSchema);

