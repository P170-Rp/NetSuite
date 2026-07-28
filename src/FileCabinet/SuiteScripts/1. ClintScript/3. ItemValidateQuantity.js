//When a user enters an item quantity greater than 100, show an alert and prevent the value.
/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/ui/dialog', 'N/currentRecord'], function(dialog, currentRecord) {

    function pageInit(context) {
        console.debug('PageINit');
    }

    function saveRecord(context) {
        console.debug('reco saved');
    }

    function validateField(context) {
        const cr = context.currentRecord;
        if( context.filedId === 'quantity' && context.sublistId === 'item'){
           const total_quantity = cr.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'quantity'
            })

            if(total_quantity > 100){
                dialog.alert({
                    title :'Alert',
                    message: 'Your can not select the item greater than 100'
                })
                return false;
            }
        }
        return true;
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
        // fieldChanged: fieldChanged,
        // postSourcing: postSourcing,
        // lineInit: lineInit,
        // validateDelete: validateDelete,
        // validateInsert: validateInsert,
        // validateLine: validateLine,
        // sublistChanged: sublistChanged
    }
});
