const fs = require("fs");
const csv = require("csv-parser");
const sql = require("mssql");
const cliProgress = require("cli-progress");
const columnHeaders = require("./dataCleanup.js");
const { Parser } = require("json2csv");
const insertJsonToSql = require("./databaseConn.js");

// Database configuration
const config = {
  server: "localhost",
  port: 1433, // or use 127.0.0.1 or your IP
  database: "Dahej_data", // replace with your actual database name
  user: "8979", // replace with your SQL user name
  password: "tsg123", // replace with your SQL user password
  options: {
    encrypt: true, // Set to true if you are using encryption
    trustServerCertificate: true, // Disable certificate validation if needed
  },
};

const b1 = new cliProgress.SingleBar({
  format:
    "File checking progress || {bar} || {percentage}% || {value}/{total} Files || ETA : {eta_formatted} || Time elapsed : {duration_formatted}",
  barCompleteChar: "\u2588",
  barIncompleteChar: "\u2591",
  hideCursor: true,
});
var total = 0;

const path = "E:\\hourly-log\\esrvtdidhj";

async function getFileList(docPath) {
  var fileContainer = [];
  var counter = 0;
  const pool = await sql.connect(config);
  // console.log("connected");
  return new Promise((resolve, reject) => {
    fs.readdir(path, (err, files) => {
      console.log(files.length);
      total = 1;
      if (total !== 0) {
        b1.start(total, 0); //initiated a progress bar after total is counted
      } else {
        console.log("No files to check");
      }
      files.forEach((file) => {
        if (counter >= total) {
          b1.stop();
          return false;
        }
        // console.log(file);
        let jsonData = [];
        const newHeaders = columnHeaders(file);
        // console.log(newHeaders);
        fs.createReadStream(path + "\\" + file)
          .pipe(
            csv({
              skipLines: 3,
              mapHeaders: ({ header, index }) => {
                return newHeaders[index];
              },
            })
          )
          .on("data", async (row) => {
            jsonData.push(row); // Only push rows after the first 3
          })
          .on("end", async () => {
            // console.log(
            //   "CSV file successfully processed and converted to JSON"
            // );
            // console.log(jsonData); // This is the JSON array without the first 3 rows
            // Result array to hold unpivoted data
            const unpivotedData = [];
            const tagData = [];
            const timeColumns = newHeaders.slice(1).slice(-24);
            // console.log(newHeaders.slice(1, 5));
            // Iterate through each row of the JSON data

            jsonData.forEach((row) => {
              const commonFields = {
                TagName: row["Tag Name"],
              };

              // Iterate over each time column and create new rows
              timeColumns.forEach((time) => {
                unpivotedData.push({
                  ...commonFields, // Spread the static fields (Field1, Field2, Field3)
                  Time: new Date(time), // Add the 'Time' column
                  Value: Number(row[time]), // Get the corresponding value for the time column
                });
              });

              tagData.push({
                "Tag Name": row["Tag Name"],
                Description: row["Description"],
                "Engg Units": row["Engg Units"],
                AlarmValue: row["AlarmValue"],
              });
            });
            // console.log(tagData); // This is the JSON array without the first 3 rows
            // console.log(unpivotedData); // This is the JSON array without the first 3 rows
            let ins = 1;
            try {
              await insertJsonToSql([{ FileName: file }], "tagDataFile", pool);
            } catch (err) {
              console.log(err);
              if (err) {
                ins = 0;
              }
            }
            if (ins === 1) {
              await insertJsonToSql(unpivotedData, "tagData", pool);
            }
          })
          .on("error", (err) => {
            console.error("Error reading CSV file:", err);
          });
        counter++;
        b1.update(counter);
        // console.log(current, total);
        if (counter == total) {
          b1.stop();
        }
      });
      resolve(fileContainer);
    });
  });
}
async function exec() {
  const fileList = await getFileList(path);
  await sql.close();
}
exec();
