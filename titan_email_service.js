const express = require("express");
const app = express();
const nodemailer = require("nodemailer");



const PORT = process.env.PORT || 5066;
var admin = require("firebase-admin");
var serviceAccount = require("./key/firebase_key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "feedback.ridsi@gmail.com",
    pass: "qvhxymkmmwaxccgz",
  },
});

app.listen(PORT, () => {
  console.log("Server started");

  subscribeToFeedbackDocument();
});

//Subscribe to Feedback event
function subscribeToFeedbackDocument() {
  return db
    .collection("UserFeedbacks")
    .where("isEmailSent", "==", false)
    .onSnapshot((querySnapshot) => {
      var time = new Date().toLocaleString();
      console.log("New feedback data arrived with size "+querySnapshot.size+" at " + time);
      querySnapshot.forEach((doc) => {
        isEmailSent = doc.data().isEmailSent;
        if (isEmailSent == null || isEmailSent == false) {
          sendEmail(doc.data())
            .then(function (response) {
              console.log(
                "Email Sent Successfully. " 
              );
              doc.ref.update({ isEmailSent: true }).catch(function (error) {
                console.log(
                  "Error while updating email flag. Reason: " + error.toString
                );
              });
            })
            .catch(function (error) {
              console.log(
                "Error while sending email. Reason: " +
                  error.toString()
              );
            });
          
        }
      });
    });
}

function isBlank(str) {
  return (!str || /^\s*$/.test(str));
}

function sendEmail(doc) {
  const attachements=[]
  if(!isBlank(doc.attachmentUrl))
  {
    attachements.push(
      {   
        filename: doc.attachmentFileName,
        path: doc.attachmentUrl 
       }
    )
  }
  const mailOptions = {
    from: 'feedback.ridsi@gmail.com', 
    to: 'ridsidash@gmail.com',
    attachments:attachements,
    subject: 'TITAN - Support Request', 
    html: `
    <br>
    <p style="font-size: 16px;"><b>Request Type: </b>`+doc.type+`</p>
    <br>
    <p style="font-size: 16px;"><b>Requester Name: </b>`+doc.requesterName+`</p>
    <p style="font-size: 16px;"><b>Requester Email: </b>`+doc.requesterEmail+`</p>
    <p style="font-size: 16px;"><b>Organization: </b>`+doc.organization+`</p>
    <p style="font-size: 16px;"><b>Requested On: </b>`+doc.requestedDate+`</p>
    <br>  
    <p style="font-size: 16px;"><b>Description</b></p>
    <p style="font-size: 16px;">`+doc.description+`</p>   
     `
};
  return transporter.sendMail(mailOptions);
}

