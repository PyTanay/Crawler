import XLSX from "xlsx"
import fs from 'fs'
import { default as axios } from "axios"
const url='http://esrvtdidhj/reports/DCS/Daily%20Monthly%20Reports/Daily_Avg/CL2_MTD/C102_Daily_Average%20(08%20Dec%202022_05%2053%2025)%20.xls'
import HttpsProxyAgent from "https-proxy-agent"
const destPath='./try.xls'

const download = (url, destPath) => {
    return new Promise((resolve, reject) => {
            axios({
                method: 'get',
                url: url,
                httpsAgent:new HttpsProxyAgent.HttpsProxyAgent(`http://10.10.200.1:8080`),
                responseType: 'arraybuffer'
                })
                .then((response)=> {
                    console.log(response.headers['content-type'])
                    const workBook =XLSX.read(response.data,{type:'array'});
                    // console.log(destPath.split('\\').slice(0,-1).join('\\'))
                    // fs.mkdirSync(destPath.split('/').slice(0,-1).join('/'),{recursive:true},(err)=>{
                    //     if(err) throw err;
                    // })
                    XLSX.writeFile(workBook, destPath.slice(0,-3)+'csv', {  bookType: "csv" ,blankrows:false});
                })
     });
};

download(url,destPath)

// const workBook =XLSX.readFile('./C102_Daily_Average (08 Dec 2022_05 53 25) .xls');
// console.log(XLSX.utils.sheet_to_csv(workBook.Sheets['Report'],{blankrows:false}))

// // console.log(workBook['Sheets']['Report'][409])
// XLSX.writeFile(workBook, destPath.slice(0,-3)+'csv', {  bookType: "csv",blankrows:false });
