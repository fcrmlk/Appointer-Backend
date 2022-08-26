const express = require("express")
const bcrypt = require("bcrypt")
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const app = express()
app.use(express.json())
const mysql = require("mysql")
require("dotenv").config()
const port = process.env.PORT
const db = mysql.createPool({
   connectionLimit: 100,
   host: process.env.DB_HOST,
   user: process.env.DB_USER,
   password: process.env.DB_PASSWORD,
   database: process.env.DB_DATABASE,
   port: process.env.DB_PORT
})
const db2 = require('./db');
db.getConnection( (err, connection)=> {
   if (err) throw (err)
   console.log ("DB connected successful: " + connection.threadId)
})

app.listen(port, ()=> console.log(`Server Started on port ${port}...`))

 async function sendEmail({ to, subject, html, from = process.env.EMAIL_FROM }) {
  
   
  const transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          auth: {
            user: process.env.USER, // generated ethereal user
            pass: process.env.PASS // generated ethereal password
          }
  })
      
 
 await transporter.sendMail({ from, to, subject, html });
 
  console.log("email sent sucessfully");
      
  };

//CREATE USER
app.post("/api/v1/register", async (req,res) => {
   const first_name = req.body.first_name;
   const last_name = req.body.last_name;
   const business_type = req.body.business_type;
   const email = req.body.email;
   const hashedPassword = await bcrypt.hash(req.body.password,10);
   db.getConnection( async (err, connection) => {
      if (err) throw (res.status(409).json({ success: false, msg: "Error", data: null}));
         const sqlSearch = "SELECT * FROM userTable WHERE email = ?"
         const search_query = mysql.format(sqlSearch,[email])
         const sqlInsert = "INSERT INTO userTable VALUES (?,?,?,?,?,?,?)"
         const insert_query = mysql.format(sqlInsert,[first_name, last_name, business_type, email, hashedPassword,null,0])
      await connection.query (search_query, async (err, result) => {
         if (err) throw (res.status(409).json({ success: false, msg: "Error", data: null}));
         console.log(result.length)
         if (result.length != 0) {
            connection.release()
            console.log("User already exists")
            res.status(409).json({ success: false, msg: "Email already exists", data: null});
         } 
         else {
            await connection.query (insert_query, (err, result)=> {
            connection.release()
            if (err) throw (res.status(409).json({ success: false, msg: "Error", data: null}));

            console.log ("New user created")
            console.log(result.insertId)
            res
            .status(200)
            .json({ success: true, msg: 'User created', data: result.insertId });
            })
         }
      })
   })
})

//LOGIN USER
app.post("/api/v1/login", (req, res)=> {
   const email = req.body.email
   const password = req.body.password
   db.getConnection ( async (err, connection)=> {
    if (err) throw (res.status(409).json({ success: false, msg: "Error", data: null}));
    const sqlSearch = "Select * from userTable where email = ?"
    const search_query = mysql.format(sqlSearch,[email])
      await connection.query (search_query, async (err, result) => {
      connection.release()
      if (err) throw (res.status(409).json({ success: false, msg: "Error", data: null}));
         if (result.length == 0) {
            console.log("User does not exist")
            res.status(404).json({ success: false, msg: 'User does not exis', data: null});
         } 
         else {
            const hashedPassword = result[0].hashedPassword
            //get the hashedPassword from result
            if (await bcrypt.compare(password, hashedPassword)) {
            // console.log(result[0].photo.data)
            var base64data = Buffer.from(result[0].photo).toString('base64');
            console.log("Login Successful")
            res
            .status(200)
            .json({ success: true, msg: 'User logged in', data: result[0],photo: base64data});
            } 
            else {
            res.status(409).json({ success: false, msg: "Password incorrect", data: null});
            }
         }
      })
   })
})

//Add photo
app.post("/api/v1/addphoto", (req, res)=> {
   const user_id = req.body.id
   const photo = req.body.photo;
   var bufferValue = Buffer.from(photo,"base64");
   db.getConnection( async (err, connection) => {
      if (err) throw (res.status(409).json({ success: false, msg: "Error", data: null}));
         const sqlSearch = "SELECT * FROM userTable WHERE id = ?"
         const search_query = mysql.format(sqlSearch,[user_id])
         const sqlInsert = "UPDATE userTable SET photo = ? WHERE id = ?"
         const insert_query = mysql.format(sqlInsert,[bufferValue,user_id])
      await connection.query (search_query, async (err, result) => {
         if (err) throw (res.status(409).json({ success: false, msg: "Error", data: null}));
         console.log(result.length)
         if (result.length == 0) {
            connection.release()
            res.status(409).json({ success: false, msg: 'User does not exists', data: null});
         } 
         else {
            await connection.query (insert_query, (err, result)=> {
            connection.release()
            if (err) throw (res.status(409).json({ success: false, msg: "Error", data: null}));
            console.log ("Photo added")
            console.log(result.insertId)
            res.status(200).json({ success: true, msg: 'Photo added', data: result});
            })
         }
      })
   })
})




app.post('/api/v1/forgotPassword', async(req, res, next)=>{
 try {
    const email = req.body.email;
   const mobileID = req.body.mobileId;
    const origin = req.header('Origin'); // we are  getting the request origin from  the origin header.
     
    const user = await db2.getUserByEmail(email);
    
     
    if(!user){
        // here we always return ok response to prevent email enumeration
       return res.json({status: 'ok'});
    }
    // Get all the tokens that were previously set for this user and set used to 1. This will prevent old and expired tokens  from being used. 
    await db.expireOldTokens(email, 1);
 
    // create reset token that expires after 1 hours
 
   const resetToken = crypto.randomBytes(40).toString('hex');
   const resetTokenExpires = new Date(Date.now() + 60*60*1000);
   const createdAt = new Date(Date.now());
  const expiredAt = resetTokenExpires;
    
    
   //insert the new token into resetPasswordToken table
   await db.insertResetToken(email, resetToken,createdAt, expiredAt, 0);
 
   // send email
   await sendPasswordResetEmail(email,resetToken, origin);
   res.json({ message: 'Please check your email for a new password' });
     
 
    } catch(e){
        console.log(e);
    }
});


async function sendPasswordResetEmail(email, resetToken, origin) {
      let message;
       
      if (origin) {
          const resetUrl = `${origin}/resetPassword?token=${resetToken} email=${email}`;
          message = `<p>Please click the below link to reset your password, the following link will be valid for only 1 hour:</p>
                     <p><a href="${resetUrl}">${resetUrl}</a></p>`;
      } else {
          message = `<p>Please use the below token to reset your password with the <code>/apiRouter/reset-password</code> api route:</p>
                     <p><code>${resetToken}</code></p>`;
      }
   
      await sendEmail({
          from: process.env.EMAIL_FROM,
          to: email,
          subject: ' Reset your Password',
          html: `<h4>Reset Password</h4>
                 ${message}`
      });
  }

   async function  validateResetToken  (req, res, next){
 
   const email = req.body.email;
   const resetToken = req.body.token;
   
   if (!resetToken || !email) {
       return res.sendStatus(400);
      }
 
   // then we need to verify if the token exist in the resetPasswordToken and not expired.
   const currentTime =  new Date(Date.now());
   const token = await db.findValidToken(resetToken, email, currentTime);
   
    
   if (!token) { 
     res.json ( 'Invalid token, please try again.');
   }
 
   next();
   };
 


  app.post('/resetPassword', validateResetToken, async(req, res, next)=>{


});
