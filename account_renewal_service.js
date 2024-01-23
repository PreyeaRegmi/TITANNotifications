const express = require("express");
const fs = require("fs");
const app = express();
const cron = require("node-cron");

const PORT = process.env.PORT || 5068;
var admin = require("firebase-admin");
var serviceAccount = require("./key/firebase_key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Create a writable stream to the log file
const logStream = fs.createWriteStream("account_renewal_log.txt", { flags: "a" });

app.listen(PORT, () => {
  console.log("Server started");

  // Run the validateRegisteredDate() function every day at 6 AM
  cron.schedule("18 16 * * *", () => {
    checkForRenewal();
  });
});

function checkForRenewal() {
  logToConsoleAndFile("Checking for renewal.");

  return db
    .collection("Users")
    .get()
    .then((querySnapshot) => {
      logToConsole("User data list size " + querySnapshot.size);
      var feedbackData = [];
      querySnapshot.forEach((doc) => {
        var regDate = doc.data()["renewalDate"];
        if (regDate) {
          var days = daysDifference(regDate);
          if (days >= 365) {
            doc.ref
              .set({ requiresRenewal: true }, { merge: true })
              .then(() => {
                logToConsoleAndFile(
                  "User " +
                    doc.id +
                    " requires renewal. No of days exceeded " +
                    days
                );
              })
              .catch((error) => {
                logToConsole(
                  "Error updating user " +
                    doc.id +
                    ". Reason: " +
                    error.toString()
                );
              });
          } else
            logToConsole(
              "User " +
                doc.id +
                " does not require renewal. No of days exceeded " +
                days
            );
        }
      });
      return feedbackData;
    })
    .catch((error) => {
      logToConsoleAndFile("Error fetching user data. Reason: " + error.toString());
      return null;
    });
}

function daysDifference(dateString) {
  const date = new Date(dateString);
  const elapsedMilliseconds = new Date().getTime() - date.getTime();
  const millisecondsInDay = 24 * 60 * 60 * 1000;
  return Math.floor(elapsedMilliseconds / millisecondsInDay);
}

function logToConsole(message)
{
  console.log(message);

}
function logToConsoleAndFile(message) {
  
  logStream.write(`${new Date().toISOString()} - ${message}\n`);
}
