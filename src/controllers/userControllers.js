const { BaseUser, Buyer, Seller, Admin } = require('../models/user.model');
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require('../utils/ApiError.js');
const { generateAccessAndRefreshTokens } = require('../utils/tokens.utils');
require('dotenv').config({ path: '../.env' });

const createUser = asyncHandler(async (req, res) => {

        const {kind, username, email, password, name} = req.body;

        const existingUser = await BaseUser.findOne({email: email.toLowerCase().trim()})

        if(existingUser)
            throw new ApiError(409, "You are already registered");
        
        const userKinds = {Buyer, Seller, Admin};
        const UserKind = userKinds[kind];

        if(!UserKind)
            throw new ApiError(400, "User kind not found")

        const user = new UserKind({username:username, email:email, password:password, name:name});
        await user.save();

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

         res
        .cookie('accessToken', accessToken, { httpOnly: true, secure: true })
        .cookie('refreshToken', refreshToken, { httpOnly: true, secure: true })
        .status(200)
        .json({ success: true, userId: user._id, email: user.email, message:"User created successfully" });

});

const googleLogin = asyncHandler(async (req, res) => {
    const { code } = req.query;

    const { data } = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
    });

    const { access_token } = data;

    const { data: profile } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
    });

    const user = await BaseUser.findOne({ email: profile.email });
    if (!user) {
        return res.status(404).json({ message: 'User not registered' });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    res
        .cookie('accessToken', accessToken, { httpOnly: true, secure: true })
        .cookie('refreshToken', refreshToken, { httpOnly: true, secure: true })
        .status(200)
        .json({ success: true, userId: user._id, email: user.email });
});

const manualLogin = asyncHandler(async (req, res)=>{
    const { email, password } = req.body;
    
    if(!email) throw new ApiError(400, "Email is required to log in");

    const user = await BaseUser.findOne({email: email});
    if(!user){
        throw new ApiError(404, "User not found");
    }

    const isPasswordVerified = await user.isPasswordCorrect(password);
    if(!isPasswordVerified) throw new ApiError(401, "Invalid user credentials");

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    res
        .cookie('accessToken', accessToken, { httpOnly: true, secure: true })
        .cookie('refreshToken', refreshToken, { httpOnly: true, secure: true })
        .status(200)
        .json({ success: true, userId: user._id, email: user.email });

});





module.exports = {
    createUser,
    googleLogin,
    manualLogin
}