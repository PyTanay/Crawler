import { spawn } from "child_process";

let psScript = `
Function Select-FolderDialog
{
    param([string]$Description="Select Folder",[string]$RootFolder="Desktop")

 [System.Reflection.Assembly]::LoadWithPartialName("System.windows.forms") |
     Out-Null     

   $objForm = New-Object System.Windows.Forms.FolderBrowserDialog
        $objForm.Rootfolder = $RootFolder
        $objForm.Description = $Description
        $Show = $objForm.ShowDialog()
        If ($Show -eq "OK")
        {
            Return $objForm.SelectedPath
        }
        Else
        {
            Write-Error "Operation cancelled by user."
        }
    }
$folder = Select-FolderDialog # the variable contains user folder selection
write-host $folder`
export function folderPopup(){
    return new Promise((resolve, reject) => {
        var child,path='',err=0;
        child = spawn("powershell.exe",[psScript]);
        child.stdout.on("data",function(data){
            if(path=='' && err!==1){
                path=data
                // console.log("Powershell Data: " + data);
            }
        });
        child.stderr.on("data",function(data){
            err=1
            //this script block will get the output of the PS script
            // console.log("Powershell Errors: " + data);
        });
        child.on("exit",function(){
            // console.log("path :"+path)
            resolve(path.toString())
        });
        child.stdin.end(); //end input
    })
}