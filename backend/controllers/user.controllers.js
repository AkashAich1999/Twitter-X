import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import {v2 as cloudninary} from "cloudinary";

export const getUserProfile = async (req, res) => {
    const { username } = req.params;

    try {
        const user = await User.findOne({ username }).select("-password");
        if(!user) return res.status(404).json({ error: "User Not Found." });
        res.status(200).json(user);
    } catch (error) {
        console.log("Error in getUserProfile Controller: ", error.message);
        res.status(500).json({ error: error.message })
    }
}

export const followUnfollowUser = async (req, res) => {
    try {
        const { id } = req.params;
        const userToModify = await User.findById(id);
        const currentUser = await User.findById(req.user._id);

        if(id === req.user._id.toString()) return res.status(400).json({ message: "You Cannot Follow/Unfollow Yourself." });
        if(!userToModify || !currentUser) return res.status(400).json({ message: "User Not Found." });

        const isFollowing = currentUser.following.includes(id);

        if(isFollowing){
            // if following, then unfollow the user
            await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
            await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
            res.status(200).json({ message:"User Unfollowed Successfully." })
            
        } else {
            // follow the user
            await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
            await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });
            // send notification to the user
            const newNotification = new Notification({
                type: "follow",
                from: req.user._id,
                to: userToModify._id,
            });

            await newNotification.save();

            res.status(200).json({ message:"User Followed Successfully." })
        }

    } catch (error) {
        console.log("Error in followUnfollowUser Controller: ", error.message);
        res.status(500).json({ error: error.message })
    }
}

export const getSuggestedUsers = async (req, res) => {
    try {
        const userId = req.user._id;
        const usersFollowedByMe = await User.findById(userId).select("following");

        const users = await User.aggregate([
            {
                $match: {
                    _id: { $ne: userId }    // exclude self
                }
            },
            { $sample: { size: 10 }}    // randomly pick 10 users
        ]);

        const filteredUsers = users.filter(user => !usersFollowedByMe.following.includes(user._id)); // Filters out users already followed by the current user.
        const suggestedUsers = filteredUsers.slice(0, 4); // Picks only the first 4 users from the filtered list.
        suggestedUsers.forEach((user) => (user.password = null)); // Removes the password field (if it exists) before sending the data.

        res.status(200).json(suggestedUsers);

    } catch (error) {
        console.log("Error in getSuggestedUsers Controller:", error.message);
        res.status(500).json({ error: error.message });
    }
}

export const updateUser = async (req, res) => {
    const { fullName, email, username, currentPassword, newPassword, bio, link } = req.body;
    let { profileImg, coverImg } = req.body;
    
    const userId = req.user._id;

    try {
        let user = await User.findById(userId);
        if(!user) return res.status(404).json({ message: "User Not Found" });

        // check if user entered both currentPassword & newPassword
        if((currentPassword && !newPassword) || (!currentPassword && newPassword)){
            return res.status(400).json({ error: "Please Provide Both Current Password & New Password." });
        }

        // condition of when user entered both currentPassword & newPassword
        if(currentPassword && newPassword){
            const isPasswordMatch = await bcrypt.compare(currentPassword, user.password); // checking the currentPassword entered by user with the password stored in the database.
            if(!isPasswordMatch) return res.status(400).json({ error: "Current Password is Incorrect." });

            if(newPassword.length < 6){
                return res.status(400).json({ error: "Password must be atleast 6 characters long." });
            }

            if(newPassword === currentPassword){
                return res.status(400).json({ error: "New Password must be Different." })
            }

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        if(profileImg){
            if(user.profileImg){
                // https://res.cloudinary.com/dyfqon1v6/image/upload/v1712997552/zmxorcxexpdbh8r0bkjb.png
                await cloudninary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0]);
            }

            const uploadedResponse = await cloudninary.uploader.upload(profileImg);
            profileImg = uploadedResponse.secure_url;
        }

        if(coverImg){
            if(user.coverImg){
                // https://res.cloudinary.com/dyfqon1v6/image/upload/v1712997552/zmxorcxexpdbh8r0bkjb.png
                await cloudninary.uploader.destroy(user.coverImg.split("/").pop().split(".")[0]);
            }

            const uploadedResponse = await cloudninary.uploader.upload(coverImg);
            coverImg = uploadedResponse.secure_url;
        }

        // update the fields if user has entered the values to update otherwise, update it to the values already stored in the database 
        user.fullName = fullName || user.fullName;
        user.email = email || user.email;
        user.username = username || user.username;
        user.bio = bio || user.bio;
        user.link = link || user.link;
        user.profileImg = profileImg || user.profileImg;
        user.coverImg = coverImg || user.coverImg;

        user = await user.save();
        
        user.password = null; // removing the password field after saving the database. so, it will not get saved in the database.

        return res.status(200).json(user); // Sends the updated user object to the frontend without the sensitive password field.

    } catch (error) {
        console.log("Error in updateUser:", error.message);
        res.status(500).json({ error: error.message })
    }
}