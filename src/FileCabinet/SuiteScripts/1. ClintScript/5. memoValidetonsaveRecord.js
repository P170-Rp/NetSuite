/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/ui/dialog', 'N/currentRecord'], function(dialog,currentRecord ) {

    function pageInit(context) {
        dialog.alert({
          title:'Welcome',
            message:'page are loaded..!'
        })
    }

    function saveRecord(context) {
        const cr = context.currentRecord;

        const memotext = cr.getText({
            fieldId: 'memo'
        })

        if(!memotext){
            dialog.confirm({
                title:'Memo is Empty...!',
                message: 'Please confirm...!'
            })
            return false;
        }else{
            dialog.confirm({
                title:'Welcome',
                message:'memo are filed...1'
            })
            return true;
        }
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
