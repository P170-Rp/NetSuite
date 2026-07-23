/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/runtime', 'N/ui/dialog'], function(runtime, dialog) {

    function pageInit(context) {
        dialog.alert({
            title: 'Welcome',
            message: 'Current user are'+context.runtime.getcurrentUser().name+'and the date is'+new Date()
        })
    }

    function saveRecord(context) {
        return true;
    }

    function validateField(context) {
        
    }

    function fieldChanged(context) {
        
    }

    function postSourcing(context) {
        
    }

    function lineInit(context) {
        
    }

    function validateDelete(context) {
        
    }

    function validateInsert(context) {
        
    }

    function validateLine(context) {
        
    }

    function sublistChanged(context) {
        
    }

    return {
        pageInit: pageInit,
        saveRecord: saveRecord,
        // validateField: validateField,
        // fieldChanged: fieldChanged,
        // postSourcing: postSourcing,
        // lineInit: lineInit,
        // validateDelete: validateDelete,
        // validateInsert: validateInsert,
        // validateLine: validateLine,
        // sublistChanged: sublistChanged
    }
});
