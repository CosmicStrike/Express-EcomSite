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
        unique: true,
        validate: {
            validator: function (e) {
                const rex = new RegExp('\\d{10}');
                return rex.test(e);
            },
            message: "Mobile number is invaild"
        },
    },

    country: {
        type: String,
        minLength: [4, 'Must be atleast 4 characters, but got less than 4'],
        maxLength: [56, 'Must bt atmost 56 characters, but got more than 56']
    },

    // To store whether the email is verified nor not
    emailVerified: {
        type: Boolean,
        required: true,
        default: false,
    },


    // To store the refresh token value, for cross checking 
    refresh: {
        type: String,
        default: null
    }
});

export default mongoose.model("User", userSchema);

