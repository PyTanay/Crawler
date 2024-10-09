const csv = require("csv-parser");
const fs = require("fs");
const { format } = require("date-fns");

fs.createReadStream("./source.csv")
  .pipe(
    csv({
      skipLines: 3,
      mapHeaders: ({ header, index }) => {
        return header.replace(/\n/g, "");
      },
    })
  )
  // .on("headers", (headers) => {
  //   // console.log(headers);
  // })
  .on("end", () => {
    console.log("datastream ended");
  });
const fileName = "TDI-C201_Daily_Average_2 (31 Oct 2021_05 57 32).csv";
// const datePattern = /(\d{2} \w{3} \d{4})/;
// const dateMatch = fileName.match(datePattern);
// // console.log(dateMatch);
// const startDate = dateMatch
//   ? new Date(new Date(dateMatch[0]).getTime() - 24 * 60 * 60 * 1000)
//   : null;
// console.log(format(startDate, "dd MMM yyyy hh:mm a"));
const columnHeaders = (filename) => {
  const headers = [
    "Sr No",
    "Tag Name",
    "Description",
    "Engg Units",
    "AlarmValue",
    "MaxValue",
    "MaxTime",
    "MinValue",
    "MinTime",
    "AvgValue",
  ];

  const datePattern = /(\d{2}%20\w{3}%20\d{4})/;
  const dateMatch = filename.match(datePattern);
  const startDate = dateMatch
    ? new Date(new Date(dateMatch[0]).getTime() - 19 * 60 * 60 * 1000)
    : null;
  for (i = 0; i < 24; i++) {
    headers.push(
      format(
        new Date(startDate.getTime() + i * 60 * 60 * 1000),
        "dd MMM yyyy hh:mm a"
      )
    );
  }
  return headers;
};
// console.log(columnHeaders(fileName));
module.exports = columnHeaders;
