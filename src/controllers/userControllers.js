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

module.exports = {
    createUser
}