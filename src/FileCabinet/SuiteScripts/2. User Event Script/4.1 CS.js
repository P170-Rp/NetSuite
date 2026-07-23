/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/ui/message'], function(message) {

    function pageInit(context) {
        message.create({
            type: message.Type.WARNING,
            title: 'Customer is inactive',
            message: 'This customer is inactive. Please review before making any changes.',
        }).show({
            duration: 5000,
        })
    }

    function saveRecord(context) {
        
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
        validateField: validateField,
        fieldChanged: fieldChanged,
        postSourcing: postSourcing,
        lineInit: lineInit,
        validateDelete: validateDelete,
        validateInsert: validateInsert,
        validateLine: validateLine,
        sublistChanged: sublistChanged
    }
});
