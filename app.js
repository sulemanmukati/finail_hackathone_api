import 'dotenv/config';
import express from 'express';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import userModel from './models/UserSchema.js'
import mongoose from 'mongoose';
import multer from 'multer';
import cloudinary from 'cloudinary';
import Order from './models/orderSchema.js';
// import fs from 'fs';

const app = express();
const port = process.env.PORT || 5678;
const DBURI = process.env.MONGODB_URI;

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
// const cors = require('cors');ra

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// MongoDB Connection
mongoose.connect(DBURI);

mongoose.connection.on("connected", () => {
  console.log("MongoDB Connected");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB Connection Error:", err);
});

// Basic route
app.get('/', (req, res) => {
  res.send('Welcome to the Dashboard');
});

// Set up storage configuration for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Image upload route
// app.post('/upload-image', upload.single('image'), async (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ message: 'No file uploaded' });
//   }

//   try {
//     // Upload the image to Cloudinary
//     const result = await cloudinary.v2.uploader.upload(req.file.path);

//     // Create a new image record in the database with Cloudinary URL
//     // Here we can save the URL as a new record in the Image collection if you wish, or just return it
//     // For now, just sending the URL back as a response
//     res.json({
//       message: 'Image uploaded and saved successfully',
//       status: true,
//       imageUrl: result.secure_url,
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: 'Error uploading image',
//       status: false,
//       error: error.message
//     });
//   }
// });
// Order Api

app.post('/orders', async (req, res) => {
  const { title, price, quantity, noodleType } = req.body;

  // Validate required fields
  if (!title || !price || !quantity || !noodleType) {
    return res.status(400).json({ message: 'All fields are required.', status: false });
  }

  try {
    // Create and save new order
    const newOrder = new Order({ title, price, quantity, noodleType });
    const savedOrder = await newOrder.save();

    // Send successful response
    res.status(201).json({
      message: 'Order placed successfully!',
      status: true,
      data: savedOrder
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error placing order.',
      status: false,
      error: error.message
    });
  }
});


// 

// Create (Sign Up)
app.post("/api/signup", async (req,res)=>{
  const{firstName,lastName,email,password} = req.body
  if (!firstName||!lastName|| !email||!password){
      res.json({
          message:"requried fuilds are missing",
          status:false,
      })
      return
  }

  const emailexiste = await userModels.findOne({email})
  if(emailexiste !== null){
      res.json({
          message:'invailed email',
          status:false
      })
      return
  }

  const hashPassword = await bcrypt.hash(password,10)
  console.log ("hashPassword",hashPassword)

  let userObj = {
      firstName,
      lastName,
      email,
      password:hashPassword,
  }
  const createUser = await userModels.create(userObj)
  res.json({
      message:'user create succesfully..',
      status :true
  })
  // console.log(body)
  res.send("signup api")
})
// Read (Get all users)
app.get('/users', async (req, res) => {
  try {
    const users = await userModel.find();
    res.json({
      message: "Users fetched successfully",
      status: true,
      data: users
    });
  } catch (error) {
    res.json({
      message: "Error fetching users",
      status: false,
      error
    });
  }
});

// Update (Update user by ID)
app.put('/user/:id', async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email } = req.body;

  if (!firstName || !lastName || !email) {
    res.json({
      message: "All fields are required",
      status: false
    });
    return;
  }

  try {
    const user = await userModel.findByIdAndUpdate(id, { firstName, lastName, email }, { new: true });
    if (!user) {
      res.json({
        message: "User not found",
        status: false
      });
      return;
    }

    res.json({
      message: "User updated successfully",
      status: true,
      data: user
    });
  } catch (error) {
    res.json({
      message: "Error updating user",
      status: false,
      error
    });
  }
});

// Delete (Remove user by ID)
app.delete('/user/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const user = await userModel.findByIdAndDelete(id);
    if (!user) {
      res.json({
        message: "User not found",
        status: false
      });
      return;
    }

    res.json({
      message: "User deleted successfully",
      status: true
    });
  } catch (error) {
    res.json({
      message: "Error deleting user",
      status: false,
      error
    });
  }
});

// User Login
app.post("/login", async (req,res)=>{
  const {email, password} = req.body;
  console.log( email, password);

  if(!email || !password){
      res.json({
          message:"required field is missing",
          status:false
      })
      return;
  }

  const loginemailExist = await userModels.findOne({email})

  if(!loginemailExist){
      res.json({
          message:"Invalid Email & Password",
          status:false
      })
      return;
  };

  const comparePassword = await bcrypt.compare(password, loginemailExist.password);

  if (!comparePassword){
      res.json({
          message:"Invalid Email & Password",
          status:false
      });
      return;
  }

  var token = jwt.sign({email: loginemailExist.email ,firstName : loginemailExist.firstName},
      process.env.JWT_SECRET_KEY
  )
  res.json({
      message:"Login Successfully",
      status:true,
      token,
  })



})

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});