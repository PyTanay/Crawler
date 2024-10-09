import fs from 'fs'
import XLSX from "xlsx"
import inquirer from 'inquirer'

const testFolder="./ETP_TDISTRG"
fs.readdir(testFolder, (err, files) => {
    files.forEach(file => {
        if(!fs.existsSync(testFolder+"_CSV/"+file.slice(0,-3)+'csv')){
        const workBook = XLSX.readFile(testFolder+"/"+file);
        fs.mkdirSync(testFolder+'_CSV',{recursive:true},(err)=>{
            if(err) throw err;
        })
            XLSX.writeFile(workBook, testFolder+"_CSV/"+file.slice(0,-3)+'csv', { bookType: "csv" });
        }
    });
  });

//   inquirer.registerPrompt('directory', require('inquirer-select-directory'));
//   inquirer.prompt([{
//     type: 'directory',
//     name: 'from',
//     message: 'Where you like to put this component?',
//     basePath: './src'
//   }]).then(function(answers) {
//     //etc
//     console.log(answers)
//   });