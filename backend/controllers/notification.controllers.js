import Notification from "../models/notification.model.js";

export const getNotifications = async (req, res) => {
    try {
        const userId = req.user._id;

        const notifications = await Notification.find({ to:userId }).populate({
            path: "from",
            select: "username profileImg"
        });

        await Notification.updateMany({ to:userId }, { read:true });

        // TODO: return the id of user as response
        res.status(200).json(notifications);
    } catch (error) {
        console.log("Error in deleteNotifications Controller", error.message);
        res.status(500).json({ error: "Internal Server Error." });
    }
}

export const deleteNotifications = async (req, res) => {
    try {
        const userId = req.user._id;

        await Notification.deleteMany({ to:userId });

        // TODO: return the id of user as response
        res.status(200).json({ message: "Notification Deleted Successfully." });
    } catch (error) {
        console.log("Error in deleteNotifications Controller", error.message);
        res.status(500).json({ error: "Internal Server Error." });
    }
}

export const deleteNotification = async (req, res) => {
    try {
        const notificationId = req.params.idd;
        const userId = req.user._id;

        const notification = await Notification.findById(notificationId);
        if(!notification) return res.status(404).json({ error: "Notification Not Found." });

        if(notification.to.toString() !== userId.toString()){
            return res.status(403).json({ error: "You are Not Allowed to Delete this Notification." });
        }

        await Notification.findByIdAndDelete(notificationId);

        res.status(200).json({ message: "Notification Deleted Successfully." });
    } catch (error) {
        console.log("Error in deleteNotification Controller", error.message);
        res.status(500).json({ error: "Internal Server Error." });
    }
}