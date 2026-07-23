/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/currentRecord', 'N/ui/dialog'], function (currentRecord, dialog) {

    function pageInit(context) {
        console.log("Page are loaded");
    }

    function saveRecord(context) {
        console.log("Page is being saved.");
        return true;
    }

    function validateField(context) {
        console.log("validateField are triggered..!");
    }

    function fieldChanged(context) {
        const currentRecord = context.currentRecord;
        if (context.fieldId === 'entity') {
            currentRecord.setValue({
                fieldId: 'memo',
                value: 'Order created by Pravin'
            })

            currentRecord.setValue({
                fieldId: 'startdate',
                value: new Date()
            })
        }
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
        validateField: validateField,
        fieldChanged: fieldChanged,
        // postSourcing: postSourcing,
        // lineInit: lineInit,
        // validateDelete: validateDelete,
        // validateInsert: validateInsert,
        // validateLine: validateLine,
        // sublistChanged: sublistChanged
    }
});
