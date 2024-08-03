import mongoose, { Schema } from "mongoose"
import Jwt  from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema(
    {
        userName: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String,
            required: true,
        },
        coverImage: {
            type: String
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        refreshToken: {
            type: String
        }
    },
    {
        timestamps: true
    }
)


//Encrypting the password before saving
userSchema.pre("save", async function(next) {
    if(!this.isModified("password"))
        return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})


//checking password given by user is correct or not
userSchema.methods.isPasswordCorrect = async function(password) {
    // console.log("saved password in db : ", this.password)
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function() {
    const accessToken =  Jwt.sign(
        {
            _id: this._id,
            email: this.email,
            userName: this.userName,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
    // console.log("access token user model : ", accessToken)
    return accessToken
}

userSchema.methods.generateRefreshToken = function() {
    return Jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


export const User = mongoose.model("User", userSchema)