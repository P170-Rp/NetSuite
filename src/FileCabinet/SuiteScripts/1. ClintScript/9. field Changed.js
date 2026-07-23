const { NUMBER } = require("oracledb");

/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([], function() {

    function pageInit(context) {
        
    }

    function saveRecord(context) {
        
    }

    function validateField(context) {
        
    }

    function fieldChanged(context) {
        const cr = context.currentRecord;
        const subId = contest.sublistId;

        const total_line  = cr.getlineCount({
            sublistId: 'item'
        })

        for(var i = 0; i < total_line; i++){
            const amount = cr.getsublistValue({
                sublistId = 'item',
                fieldId = 'amount',
                line: i
            });

            let total_amount =+ NUMBER(amount);

        }

        cr.setValue({
            fieldId: 'memo',
            value: total_amount
        })
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
        sublistChanged: sublistChanged
    }
});
