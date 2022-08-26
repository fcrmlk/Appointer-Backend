const mysql = require('mysql');
   
    
    
const pool = mysql.createPool({
    connectionLimit: 100,    // the number of connections node.js will hold open to our database
    password: process.env.DB_PASSWORD,
    user: process.env.DB_USER,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT
    
});

 // async function allUser = () =>{
 //      return new Promise((resolve, reject)=>{
 //          pool.query('SELECT * FROM userTable ', (error, users)=>{
 //              if(error){
 //                  return reject(error);
 //              }
 //              return resolve(users);
 //          });
 //      });
 //  };
//  async function getUserByEmail = (email) =>{
//       return new Promise((resolve, reject)=>{
//           pool.query('SELECT * FROM userTable WHERE email = ?', [email], (error, users)=>{
//               if(error){
//                   return reject(error);
//               }
//               return resolve(users[0]);
               
//           });
//       });
//   };
//  async function updateUserPassword = ( password, id) =>{
//     return new Promise((resolve, reject)=>{
//         pool.query('UPDATE userTable SET  password=? WHERE id = ?', [ password, id], (error)=>{
//             if(error){
//                 return reject(error);
//             }
             
//               return resolve();
//         });
//     });
// };

//  async function insertResetToken = (email,tokenValue, createdAt, expiredAt, used) =>{
//     return new Promise((resolve, reject)=>{
//         pool.query('INSERT INTO ResetPasswordToken ( email, Token_value,created_at, expired_at, used) VALUES (?, ?,?, ?, ?)', [email,tokenValue, createdAt, expiredAt, used], (error, result)=>{
//             if(error){
//                 return reject(error);
//             }
             
//               return resolve(result.insertId);
//         });
//     });
// };

//  async function expireOldTokens = (email, used) =>{
//     return new Promise((resolve, reject)=>{
//         pool.query('UPDATE ResetPasswordToken SET used = ?  WHERE email = ?', [ used, email], (error)=>{
//             if(error){
//                 return reject(error);
//             }
             
//               return resolve();
//         });
//     });
// };
 
//  async function findValidToken = (token, email, currentTime) =>{
//     return new Promise((resolve, reject)=>{
//         pool.query('SELECT * FROM ResetPasswordToken WHERE (email = ? AND Token_value = ? AND expired_at > ?)', [email,token,  currentTime  ], (error, tokens)=>{
//             if(error){
//                 return reject(error);
//             }
//             return resolve(tokens[0]);
//             //return resolve(token);
//         });
//     });
// };



 
module.exports = pool


// module.exports = {pool,findValidToken,allUser,getUserByEmail,updateUserPassword,insertResetToken,expireOldTokens};
