const User = require('../models/User')
const Work = require('../models/Work')
const Bookmark = require('../models/Bookmarked')
const Notifications = require('../models/Notification')
const nodemailer = require('nodemailer')
require("dotenv").config();
const jwt = require('jsonwebtoken')
let emailaddress = "";
let OTP = "";

const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.MAIL,
        pass: process.env.PASSWORD,
    }
});

const mailOptions = {

    from: {
        name: "Seek Safe Work",
        address: process.env.MAIL
    },
    // to: `${emailaddress}`,
    subject: "Email verification OTP",
    text: "Hello User",
    html: "<b>Hello. This mail is on confirmation of account login in to seek safe work.</b>"
}

const sendMail = async (transporter, mailOptions, emailaddress, output) => {
    mailOptions.to = emailaddress;
    mailOptions.html = output

    try {
        await transporter.sendMail(mailOptions);
        console.log("Email has been sent");
    } catch (error) {
        console.log(error);
    }
}
//handle errors
const handleErrors = (err) => {
    let errors = { userName: '', pincode: '', email: '', password: '' }
    console.log(err)

    //incorrect email
    if (err.message === 'incorrect email') {
        errors.email = 'that email is not registered';
        return errors;
    }

    //incorrect password
    if (err.message === 'incorrect password') {
        errors.password = 'that password is incorrect';
        return errors;
    }

    //duplicate error code
    if (err.code === 11000) {
        errors.email = 'That email is already registered';
        return errors;
    }
    //validate errors
    if (err.message.includes('User validation failed')) {
        Object.values(err.errors).forEach(({ properties }) => {
            errors[properties.path] = properties.message;
        })
    }
    return errors;
}

//Handling Work errors
const workHandleErrors = (err) => {
    let errors = { workTitle: '', category: '', locatoin: '', majorCity: '', pincode: '', workingHours: '', numOfWorkers: '', durationOfWork: '', salary: '', phoneNumber: '' }
    console.log(err.message);
    // console.log(err.errors);
    if (err.message.includes('Work validation failed')) {
        Object.values(err.errors).forEach(({ properties }) => {
            errors[properties.path] = properties.message;
        })
    }
    return errors
}

//creating tokens
const secret = 'aer34tsdfq34taasdfadfadfadfad';
const maxAge = 3 * 24 * 60 * 60;
const createToken = (id, userName) => {
    return jwt.sign({ id, userName }, secret, {
        expiresIn: maxAge,
    })
}
module.exports.signup_get = (req, res) => {

    res.send("ok")
}

module.exports.login_get = (req, res) => {
    console.log("logingetcookie", req.cookies)
    res.send(req.cookies);
}

module.exports.signup_post = async (req, res) => {
    console.log(req.body)
    const { email, password, userName, pincode } = req.body;

    try {
        const user = await User.create({ userName, email, password, pincode });
        console.log("From signup post after user being created ", user);
        console.log(email);
        const token = createToken(user._id, user.userName);
        res.cookie('jwt', token, {
            maxAge: maxAge * 1000,
            httpOnly: true,
            sameSite: 'None', // Ensure cross-site cookies are allowed
            secure: true // Ensure the cookie is only sent over HTTPS
        });
        await Notifications.create({
            author: user._id,
            unviewed: [], // Assuming doc._id is the post ID
            viewed: [] // Initialize viewed as an empty array
        });
        const output = `
                Hello ${user.userName}, welcome to Seek Safe Work Family!

                Hope you will get your desired work that is more secure and safe.
                If you find any difficulty, reach us at any time.

                Thank you and visit regularly to find your works!
                `;
        sendMail(transporter, mailOptions,email, output);
        res.status(201).json({ id: user._id.toString(), userName: user.userName });
    } catch (err) {
        const errors = handleErrors(err);
        // console.log("my error", { errors });
        res.status(400).json({ errors });
    }

}

module.exports.login_post = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.login(email, password);
        const token = createToken(user._id, user.userName);
        res.cookie('jwt', token, {
            maxAge: maxAge * 1000,
            httpOnly: true,
             sameSite: 'None', // Ensure cross-site cookies are allowed
             secure: true // Ensure the cookie is only sent over HTTPS
        });
        res.status(200).json({ id: user._id, userName: user.userName });
    } catch (error) {
        const errors = handleErrors(error);
        res.status(400).json({ errors })
    }
}

module.exports.logout_get = (req, res) => {
    res.clearCookie('jwt', {
        httpOnly: true,
        sameSite: 'None',
        secure: true 
    });
    res.json({ suc: true });
    // res.redirect('/')
}

module.exports.profile_get = (req, res) => {
    const token = req.cookies.jwt
    if (!token) {
        return res.status(401).json({ error: 'Token not provided' });
    }
    jwt.verify(token, secret, {}, async (err, info) => {
        if (err) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        // console.log("Iam from profile ", info);
        res.json(info);
    })
}

module.exports.work_post = async (req, res) => {
    const token = req.cookies.jwt
    console.log(req.body)
    if (!token) {
        return res.status(401).json({ error: 'Token not provided' });
    }
    jwt.verify(token, secret, {}, async (err, info) => {
        if (err) {
            console.log("error")
            return res.status(401).json({ error: 'Invalid token' });
        }
        console.log(`req body is ${req.body}`)

        try {
            const workDoc = await Work.create({
                ...req.body, author: info.id
            });

            const usersToNotify = await User.find({ pincode: workDoc.pincode });

            usersToNotify.forEach(async (user) => {
                try {
                    if (user._id.toString() !== info.id) {
                        console.log(user._id.toString(),info.id)
                        const userNotifications = await Notifications.findOne({ author: user._id });
                        if (userNotifications) {
                            // User exists, add post ID to unviewed array
                            userNotifications.unviewed.push(workDoc._id); // Assuming doc._id is the post ID
                            await userNotifications.save();
                        } else {
                            // User doesn't exist, create a new user notification
                            const userNotifications = await Notifications.create({
                                author: user._id,
                                unviewed: [workDoc._id], // Assuming doc._id is the post ID
                                viewed: [] // Initialize viewed as an empty array
                            });
                        }
                    }
                } catch (error) {
                    console.error('Error updating notifications for user:', error);
                }
            });

            res.json(workDoc);
        } catch (error) {
            const errors = workHandleErrors(error)
            console.log(errors);
            res.status(500).json({ errors });
        }
    })
}

module.exports.post_get = async (req, res) => {
    try {
        const posts = await Work.find().populate('author', 'userName').sort({ createdAt: -1 });
        posts.forEach(post => {
            // console.log(`From get ${post.author.userName}`);
        });

        res.json(posts);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

module.exports.myposts_get = async (req, res) => {
    try {
        const { id } = req.params;
        // console.log('Received id:', id);
        if (!id) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }
        const posts = await Work.find({ author: id });
        res.json(posts);
    } catch (error) {
        console.error('Error in myposts_get:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports.getpost_get = async (req, res) => {
    const { id } = req.params;
    console.log(`Id from ${id}`)
    try {
        if (!id) {
            return res.status(400).json({ error: 'Invalid id' });
        }
        const post = await Work.findById(id).populate('author', 'userName')
        // console.log(post);
        res.json(post);
    } catch (error) {
        console.error('Error in myposts_get:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
module.exports.getnotificatoinpost_get = async (req, res) => {
    const { id, userId } = req.params;
    // console.log(`Id from ${userId} ${id}`)
    try {
        if (!id) {
            return res.status(400).json({ error: 'Invalid id' });
        }
        const post = await Work.findById(id).populate('author', 'userName')
        // console.log(post);
        const notification = await Notifications.findOne({ author: userId });
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        // Check if notification has the properties unviewed and viewed
        if (!notification.unviewed || !notification.viewed) {
            return res.status(500).json({ error: 'Invalid notification format' });
        }
        notification.unviewed.pull(id);
        notification.viewed.push(id);
        await notification.save();
        res.json(post);
    } catch (error) {
        console.error('Error in myposts_get:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports.editpost_put = async (req, res) => {
    const { id } = req.params;
    const { authorId, ...updateData } = req.body; // Assuming the updated data and authorId are sent in the request body

    try {
        const updatedPost = await Work.findOneAndUpdate(
            { _id: id, author: authorId }, // Find the document by both _id and author
            updateData,
            { new: true }
        );
        if (!updatedPost) {
            return res.status(404).json({ error: 'Post not found or you are not authorized to update it.' });
        }
        // console.log("updated", updatedPost);
        res.json(updatedPost); // Return the updated post
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ error: 'An error occurred while updating the post.' });
    }
}

module.exports.mypost_delete = async (req, res) => {
    const { userId, cardId } = req.body;
    // console.log(cardId);
    const post = await Work.findOneAndDelete({ _id: cardId });
    // console.log(post);
    res.json("Ok");
}

module.exports.postBookmark_post = async (req, res) => {

    const { id, userId } = req.body;
    try {
        const bookmark = await Bookmark.findOne({ author: userId });
        if (bookmark) {
            if (!bookmark.saved.includes(id)) {
                bookmark.saved.push(id);
                await bookmark.save();
            }
        } else {
            const newBookmark = await Bookmark.create({ id, author: userId });
            await bookmark.save();
            // console.log(`Created bookmark: ${newBookmark}`);
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports.removeBookmark_put = async (req, res) => {
    const { id, userId } = req.body;
    try {
        if (!id || !userId) {
            return res.status(400).json({ success: false, message: "Both 'id' and 'userId' are required." });
        }

        const bookmark = await Bookmark.findOne({ author: userId });
        if (!bookmark) {
            return res.status(404).json({ success: false, message: "Bookmark not found." });
        }
        bookmark.saved.pull(id);
        await bookmark.save();

        res.status(201).json({ success: true });
    } catch (error) {
        // console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}
module.exports.myBookmarks_get = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: 'Author ID is required' });
        }
        const Data = await Bookmark.findOne({ author: id })
                                   .populate({
                                       path: 'saved', // populate the 'saved' field
                                       populate: {
                                           path: 'author', // within each 'saved', populate 'author'
                                           model:'User',
                                           select: 'username' // select only the 'username' field from the author
                                       }
                                   });

        if (!Data) {
            return res.status(404).json({ error: 'No bookmarks found for the author' });
        }
        res.json(Data.saved);
    } catch (error) {
        console.error('Error fetching bookmarks:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports.upvoteAndDownVote_get = async (req, res) => {
    const { cardId } = req.params
    const post = await Work.findById(cardId);
    // console.log('opoio', post)
    let upvotes = 0, downvotes = 0;
    if (post.upvotes) {
        upvotes = post.upvotes.length;
    }
    if (post.downvotes) {
        downvotes = post.downvotes.length;
    }
    res.json({ upvotes, downvotes })
}
module.exports.upvote_put = async (req, res) => {
    const { cardId, userId } = req.body;
    if (typeof userId === 'undefined') res.json({ suc: true })

    else {
        const post = await Work.findById(cardId)

        if (post.downvotes.includes(userId)) {
            post.downvotes.pull(userId);
        }
        if (!post.upvotes.includes(userId)) {
            post.upvotes.push(userId);
        }
        await post.save()
        if (post.upvotes) {
            upvotes = post.upvotes.length;
        }
        if (post.downvotes) {
            downvotes = post.downvotes.length;
        }
        res.json({ upvotes, downvotes })

    }
}
module.exports.downvote_put = async (req, res) => {
    const { cardId, userId } = req.body;
    if (typeof userId === 'undefined') res.json({ suc: true })

    else {
        const post = await Work.findById(cardId)
        // console.log(post)
        if (!post) res.json({ suc: true });
        if (post.upvotes.length && post.upvotes.includes(userId)) {
            post.upvotes.pull(userId);
        }
        if (!post.downvotes.includes(userId)) {
            post.downvotes.push(userId);
        }
        await post.save()

        if (post.upvotes) {
            upvotes = post.upvotes.length;
        }
        if (post.downvotes) {
            downvotes = post.downvotes.length;
        }
        res.json({ upvotes, downvotes })
    }
}

// module.exports.notification_get = async (req, res) => {
//     const { id } = req.params;
//     // console.log("ID", id);
//     if (!id) {
//         return res.status(400).json({ error: 'ID parameter is missing or invalid' });
//     }
//     let count = 0; // Initialized here
//     try {
//         const userNotifications = await Notifications.findOne({ author: id }).populate('unviewed');
//         if (!userNotifications || !userNotifications.unviewed) {
//             // console.log('No notifications found or unviewed notifications array is empty.');
//             return res.json(userNotifications.unviewed); // Sending response with info and count
//         }
//         res.json(userNotifications); // Sending response with info and count
//     } catch (error) {
//         console.error('Error fetching notifications:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

module.exports.notification_get = async (req, res) => {
    const { id } = req.params;
    // console.log("ID", id);
    if (!id) {
        return res.status(400).json({ error: 'ID parameter is missing or invalid' });
    }
    let count = 0; // Initialized here
    try {
        const userNotifications = await Notifications.findOne({ author: id }).populate('unviewed');
        if (!userNotifications) {
            return res.json({ error: 'No notifications found for this user' });
        }
        if (!userNotifications.unviewed) {
            console.log('No unviewed notifications found.');
            return res.json(userNotifications); // Sending response with info and count
        }
        res.json(userNotifications); // Sending response with info and count
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
module.exports.clearNotificatoins = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ error: 'ID parameter is missing or invalid' });
    }
    let count = 0; // Initialized here
    try {
        const userNotifications = await Notifications.findOne({ author: id }).populate('unviewed');
        if (!userNotifications || !userNotifications.unviewed) {
            console.log('No notifications found or unviewed notifications array is empty.');
            return res.json(userNotifications.unviewed); // Sending response with info and count
        }
        userNotifications.viewed.push(...userNotifications.unviewed);
        userNotifications.unviewed = []; // Clear the unviewed array
        await userNotifications.save();
        count = userNotifications.viewed.length; // Update the count

        res.json({ message: 'Notifications cleared successfully', count });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

function isValidEmail(email) {
    // Regular expression for validating email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}


module.exports.sendOtp_get = async (req, res) => {
    const { email } = req.params;
    // console.log(email);

    // Validate email format first
    if (!isValidEmail(email)) {
        return res.status(400).json({ errors: { email: 'Please provide a valid email' } });
    }

    try {
        // Check if email already exists
        const isExist = await User.findOne({ email: email });
        console.log('User exists:', isExist);
        if (isExist) {
            return res.status(400).json({ errors: { email: 'This email is already registered. Try with a different one.' } });
        }

        // Generate OTP
        OTP = Math.floor(100000 + Math.random() * 900000);
        console.log("Sending mail to", email);
        // console.log("OTP", OTP);
        const output = `<h4>Your Verification OTP is ${OTP}</h4>`;

        // Modify sendMail to return a Promise and handle it properly
        await sendMail(transporter, mailOptions, email, output);

        res.status(201).json({ success: 'true' });
    } catch (error) {
        // console.error("From error", error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
};

module.exports.verifyOtp_get = async (req, res) => {
    const { otp } = req.params;
    // console.log(otp)
    // console.log(OTP);
    if (otp == OTP) {
        res.status(201).json({ sucess: true })
    }
    else res.status(400).json({ sucess: false })
}
