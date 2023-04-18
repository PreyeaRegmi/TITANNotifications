const express = require("express");
const app = express();
const cron = require("node-cron");

const PORT = process.env.PORT || 5067;
var admin = require("firebase-admin");
var serviceAccount = require("./key/firebase_key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

app.listen(PORT, () => {
  console.log("Server started");

  // Run the validateRegisteredDate() function every day at 2 AM
  cron.schedule("44 20 * * *", () => {
    checkForRenewal();
  });
});

function checkForRenewal() {
  return db
    .collection("Users")
    .get()
    .then((querySnapshot) => {
      console.log("User data list size "+querySnapshot.size);
      var feedbackData = [];
      querySnapshot.forEach((doc) => {
        var regDate = doc.data()['renewalDate'];
        if (regDate ) {
          var days= daysDifference(regDate);
          if(days>=365)
          {
            doc.ref.set({ requiresRenewal: true },{ merge: true })
            .then(() => {
              console.log("User " + doc.id + " requires renewal. No of days exceeded "+days);
            })
            .catch((error) => {
              console.log("Error updating user " + doc.id + ". Reason: " + error.toString());
            });
          } 
          else
            console.log("User " + doc.id + " does not requires renewal. No of days exceeded "+days);       
        }
      });
      return feedbackData;
    })
    .catch((error) => {
      console.log("Error fetching feedback data. Reason: " + error.toString());
      return null;
    });
}

function daysDifference(dateString) {
  const date = new Date(dateString);
  const elapsedMilliseconds = new Date().getTime() - date.getTime();
  const millisecondsInDay = 24 * 60 * 60 * 1000;
  return Math.floor(elapsedMilliseconds / millisecondsInDay);
}


