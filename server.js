const express = require("express");
const app = express();
const nodemailer = require("nodemailer");

// const PORT = process.env.PORT || 5059;
const PORT = process.env.PORT || 5064;
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

  //Observe all the avialable event sources and send notification to the corresponding subscribed users.
  subscribeToFeedbackDocument();
});

//Subscribe to Transcore Stalled Vehicle Event
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

function sendEmail(doc) {
  const mailOptions = {
    from: 'feedback.ridsi@gmail.com', // Something like: Jane Doe <janedoe@gmail.com>
    to: 'prrgfb@umsystem.edu',
    subject: 'TITAN - Support Request', // email subject
    html: `<p style="font-size: 16px;">Pickle Riiiiiiiiiiiiiiiick!!</p>
        <br />
        <img src="https://images.prod.meredith.com/product/fc8754735c8a9b4aebb786278e7265a5/1538025388228/l/rick-and-morty-pickle-rick-sticker" />
    ` // email content in HTML
};
  return transporter.sendMail(mailOptions);
}

