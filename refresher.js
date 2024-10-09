import { default as axios } from "axios";
import HttpsProxyAgent from "https-proxy-agent";
import { JSDOM } from "jsdom";
import fs from "fs";
import XLSX from "xlsx";
import rateLimit from "axios-rate-limit";
import cliProgress from "cli-progress";

const b1 = new cliProgress.SingleBar({
  format:
    "Download Progress || {bar} || {percentage}% || {value}/{total} Files || ETA : {eta_formatted} || Time elapsed : {duration_formatted}",
  barCompleteChar: "\u2588",
  barIncompleteChar: "\u2591",
  hideCursor: true,
});

const url =
  "http://esrvtdidhj/reports/DCS/Daily%20Monthly%20Reports/Daily_Avg/";
const http = rateLimit(axios.create(), {
  maxRequests: 10,
  perMilliseconds: 1000,
  maxRPS: 10,
});
var total = 0,
  current = 0,
  req = 0;

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

async function getSectionList(url) {
  const container = {};
  const html = await http.get(url, {
    httpsAgent: new HttpsProxyAgent.HttpsProxyAgent(`http://10.10.200.1:8080`),
  });
  const dom = new JSDOM(html.data);
  dom.window.document.querySelectorAll("a").forEach((element) => {
    var address = new URL(element, url).href;
    if (address.length >= url.length) {
      container[element.text] = [address];
    }
  });
  return container;
}
async function getUrlList(url) {
  const urlList = [];
  const html = await http.get(url, {
    httpsAgent: new HttpsProxyAgent.HttpsProxyAgent(`http://10.10.200.1:8080`),
  });
  const dom = new JSDOM(html.data);
  dom.window.document.querySelectorAll("a").forEach((element) => {
    var address = new URL(element, url).href;
    if (address.length >= url.length) {
      urlList.push(address);
    }
  });
  return urlList;
}
async function convertUrlToList(container1) {
  for (const [key, value] of Object.entries(container1)) {
    await asyncForEach(value, async (elem) => {
      if (!elem.includes(".xls")) {
        value.push(...(await getUrlList(elem)));
      }
    });
  }
  for (var [key, value] of Object.entries(container1)) {
    container1[key] = value.filter((elem) => elem.includes(".xls"));
    // console.log(key,value)
  }
  return container1;
}
async function getFileList(docPath, url) {
  var fileContainer = {};
  return new Promise((resolve, reject) => {
    fs.readdir(path + "\\" + url.split("/")[2] + "\\", (err, files) => {
      files.forEach((file) => {
        var secName = file.split("-");
        if (fileContainer[secName[0]] == undefined) {
          fileContainer[secName[0]] = [];
        }
        fileContainer[secName[0]].push(secName[1]);
      });
      resolve(fileContainer);
    });
  });
}
const urlListToFileList = (container) => {
  var temp = JSON.parse(JSON.stringify(container));
  Object.keys(temp).forEach((key) => {
    temp[key].forEach((elem, i) => {
      // console.log(container[key][i])
      temp[key][i] = elem.split("/").slice(-1).join().slice(0, -3) + "csv";
    });
  });
  return temp;
};
const listCompare = (fl, ul) => {
  var ufl = urlListToFileList(ul);
  var ulTemp = JSON.parse(JSON.stringify(ul));
  Object.keys(fl).forEach((key) => {
    fl[key].forEach((f) => {
      var index = ufl[key].indexOf(f);
      if (index !== -1) {
        ulTemp[key].splice(index, 1);
        ufl[key].splice(index, 1);
      }
    });
  });
  return ulTemp;
};

const download = (url, destPath) => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(destPath.slice(0, -3) + "csv")) {
      http({
        method: "get",
        url: url,
        httpsAgent: new HttpsProxyAgent.HttpsProxyAgent(
          `http://10.10.200.1:8080`
        ),
        responseType: "arraybuffer",
      })
        .then((response) => {
          const workBook = XLSX.read(response.data, {
            sheetRows: 1000,
            dense: true,
          });
          // console.log(destPath.split('\\').slice(0,-1).join('\\'))
          // fs.mkdirSync(destPath.split('/').slice(0,-1).join('/'),{recursive:true},(err)=>{
          //     if(err) throw err;
          // })
          XLSX.writeFile(workBook, destPath.slice(0, -3) + "csv", {
            bookType: "csv",
            blankrows: false,
          });
        })
        .then((res) => {
          current++;
          b1.update(current);
          // b1.updateETA()
        });
    } else {
      current++;
      setTimeout(() => {
        b1.update(current);
      }, 10);
    }
    if (current == total) {
      setTimeout(() => {
        b1.stop();
      }, 100);
    }
  });
};
const downloadAll = (obj1, url) => {
  // console.log(keys.length)
  Object.keys(obj1).forEach((elem, j) => {
    if (j >= 0) {
      obj1[elem].forEach((elem1, i) => {
        if (i >= 0) {
          // console.log(path+'\\'+url.split('/')[2]+'\\'+elem+'-'+elem1.split('/').slice(-1).join())
          total++;
          download(
            elem1,
            path +
              "\\" +
              url.split("/")[2] +
              "\\" +
              elem +
              "-" +
              elem1.split("/").slice(-1).join()
          );
        }
      });
    }
  });
  if (total !== 0) {
    b1.start(total, 0); //initiated a progress bar after total is counted
  } else {
    console.log("No new files to download.");
  }
};
const combineAll = async (path) => {
  var fileList;
  fs.readdir(path, async (err, files) => {
    if (err) {
      console.log(err);
    } else {
      const wb1 = XLSX.readFile(path + "\\" + files);
      const ws1 = wb1.Sheets[wb1.SheetNames[0]];
      var range = XLSX.utils.decode_range(ws1["!ref"]);
      range.s.r = 3;
      ws1["!ref"] = XLSX.utils.encode_range(range);
      for (let i = range.s.c; i <= range.e.c; i++) {
        var cell1 = ws1[XLSX.utils.encode_cell({ c: i, r: 3 })];
        if (cell1 !== undefined) {
          cell1.v = cell1.v.replace(/(\r\n|\n|\r)/gm, "");
        }
      }
      b1.update(i);
      if (ws1["A4"] == undefined) {
        errors++;
      } else if (ws1["A4"].v !== "Sr No") {
        errors2++;
      }
      XLSX.writeFile(wb1, "./try.csv", { bookType: "csv", blankrows: false });
      console.log(XLSX.utils.decode_range(ws1["!ref"]));
    }
  });
};
// console.log('Errors : '+errors)

// download('http://esrvtdidhj/reports/DCS/Daily%20Monthly%20Reports/Daily_Avg/BOILER_BCU_AIR_VAM/C400_Daily_Average%20(03%20Dec%202022_06%2002%2057)%20.xls','E:/try/csvdownload/try1.xls')

// var path=await folderPopup()
var path = "E:\\hourly-log";
// path=path.replace(/(\r\n|\n|\r)/gm, "")
// if(path==""){
//     throw new Error("No path specified")
// }
fs.mkdirSync(
  path + "\\" + url.split("/")[2] + "\\",
  { recursive: true },
  (err) => {
    if (err) throw err;
  }
);
// combineAll(path + "\\" + url.split("/")[2] + "\\");
var fileList = await getFileList(path, url);
var container1 = await getSectionList(url);
var urlList = await convertUrlToList(container1);
var temp = listCompare(fileList, urlList);
fs.writeFile("./urlList.json", JSON.stringify(temp, null, 2), () => {});
// fs.writeFile("./fileList.json", JSON.stringify(fileList, null, 2), () => {});
// fs.writeFile("./fileList.json", JSON.stringify(temp, null, 2), () => {});
// var temp = JSON.parse(fs.readFileSync("./fileList.json"));
// console.log(temp);
downloadAll(temp, url);
