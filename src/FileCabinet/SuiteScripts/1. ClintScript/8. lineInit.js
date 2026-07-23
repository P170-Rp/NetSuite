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
        
    }

    function postSourcing(context) {
        
    }

    function lineInit(context) {
        const cr = context.currentRecord;
        const subLId = context.sublistId;

        const currentIndex = cr.getCurrentSublistIndex({
            sublistId : 'item'
        })
        console.log('current Index are: ' + currentIndex);;


        const rate = cr.getCurrentSublistValue({
            sublistId:'item',
            fieldId:'rate'
        })

        const dis = cr.getCurrentSublistValue({
            sublistId:'item',
            fieldId:'description'
        })

        if(!rate || dis){
            cr.setCurrentSublistValue({
                sublistId:'item',
                filedId:'description',
                value:'record  Has been successfully done..'
            })
        }
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
        lineInit: lineInit,
        // validateDelete: validateDelete,
        // validateInsert: validateInsert,
        // validateLine: validateLine,
        // sublistChanged: sublistChanged
    }
});
