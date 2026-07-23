/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/record'], function(record) {

    function pageInit(context) {
        
        const customer = record.create({
            type: record.Type.CUSTOMER,
            isDynamic: false,
        })

        customer.setText({
            fieldId: 'companyname',
            text:'Balvirt'
        })
        customer.setValue({
            fieldId: 'subsidiary',
            value: 3
        })


        console.log(customer.save());

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
        // saveRecord: saveRecord,
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
