
/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/ui/dialog'], function (dialog) {

    // function pageInit(context) {


    // }

    function saveRecord(context) {

        alert('Saving record...!');

            dialog.confirm({
                title: 'WelCome: Sir',
                message: 'please save'
            }).then(function (result) {
                if(result){
                    console.log('User Clicked Ok');
                }
                else{
                    console.log('User Clicked Cancel');
                }
            });

        return true;
    }

    return {
        // pageInit: pageInit,
        saveRecord: saveRecord
    }
});
