import express from 'express';
const router = express.Router();
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import  {collection1,collection2} from '../model/userSchema.js';
import jwt from 'jsonwebtoken';
import Authenticate from '../Middleware/authenticate.js';
import multer from 'multer';
import {v4 as uuidv4} from 'uuid';
const DIR ='./public/uploads/';
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, DIR);
    },
    filename: (req, file, cb) => {
        const fileName = file.originalname;
        cb(null, fileName)
    }
});
var upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
            cb(null, true);
        } else {
            cb(null, false);
            return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
        }
    }
});
router.get('/',(req,res)=>{
    res.send('This is home page 1');
});

const addDetails = async(req,res)=>{
    console.log("Reached the backend");
    const name = req.body.name;
    const email = req.body.email;
    const gender = req.body.gender; 
    const age = req.body.age;
    const password = req.body.password;
    console.log("age",age)
    const profilepic=req.file.originalname;
    if(!name || !email|| !gender ||!age||!password){
        return res.status(422).json({error: "please fill the details"});
    }
    try{
        const userExist= await collection1.findOne({email:email});
        if(userExist){
            return res.status(422).json({error: "email exist"});
        }
        const user = new collection1({name,email,gender,age,password,profilepic});
        user.password = await bcrypt.hash(user.password , 10)
        await user.save();
        console.log(user);
        res.status(201).json({message: "registered succussfully"});
        
    }catch(err) {
        console.log(err);
    }

};
router.post('/register',upload.single('profilepic'),addDetails);

//-----------------------------Login Route------------------
router.post('/signin',async(req,res) => {
    try {
        let token;
        const {email,password} = req.body;
        if(!email || !password){
            return res.status(400).json({error:"please fill data"})
        }

        const userLogin = await User.findOne({email:email});
        console.log(userLogin);
        //promises must be handled
        if(!userLogin){
            res.status(400).json({error:"user  error login "});
        }else{
            const isMatch = bcrypt.compare(password,userLogin.password);
            token = await userLogin.generateAuthToken();
            res.cookie("jwtoken",token);
            if(isMatch){
                res.json({message:"user login successfully"});
            }
        }
    }catch (err) {
        console.log(err); 
    }
});
router.get('/profile', Authenticate ,async(req,res) => {
    console.log("This is about page");
    res.send(req.rootUser);
})

//To update
const updateDocument = async(name,email)=>{
    try{
        const result = await collection1.updateOne({name,email},{
            $set:{
                age: "101"
            }
        });
        console.log(result);
    }
    catch(err){
        console.log(err);
    }
}  

// To sync data from collection 1 to collection2
const sync = async(req,res)=>{
    console.log("reached to sync")
    collection1.find({name:"sowmya1"}).then(function(data, err) {
      if (err) 
      {
        console.log("Thesre is an error");
        console.log(err);
      } 
      else 
      {
        console.log("data",data);
      }
      collection2.insertMany(data,{ ordered: false }).then(d=>{
        console.log('saved successfully');
        updateDocument("sowmya1","sowmya1@gmail.com");
      })
      .catch(error =>{
       //if the error is the duplicate error then we need to append comment it to the existing one
          //console.log(data.report)
          console.log(error);
      })
    })
  }
router.get('/sync',sync);



export default router;