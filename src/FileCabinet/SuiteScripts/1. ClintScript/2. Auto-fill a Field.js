
// When the user selects a customer, automatically fill the Memo field with: customer name and some text

/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/currentRecord', 'N/ui/message', 'N/ui/dialog'], function(currentRecord,message,dialog) {

    function pageInit(context) {
        console.log('pageInit');
    }

    function saveRecord(context) {
        console.log('reco Saved');
    }

    function validateField(context) {
        
    }

    function fieldChanged(context) {
        const cr = context.currentRecord;
        if(context.fieldId == 'entity'){
            const cust_name = cr.getText({
                fieldId: 'entity'
            })
        }
        cr.setValue({
            fieldId: 'memo',
            value: `${cust_name} customore are buying goods.`
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
        fieldChanged: fieldChanged,
        // postSourcing: postSourcing,
        // lineInit: lineInit,
        // validateDelete: validateDelete,
        // validateInsert: validateInsert,
        // validateLine: validateLine,
        // sublistChanged: sublistChanged
    }
});
