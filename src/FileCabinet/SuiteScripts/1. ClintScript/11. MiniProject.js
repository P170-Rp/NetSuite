// Create a Client Script for a Sales Order that does all of the following:
// ✅ On page load, display a welcome message.
// ✅ When a customer is selected, automatically fill the Memo field.
// ✅ Prevent quantity greater than 100.
// ✅ Before saving, confirm with the user.
// ✅ Prevent saving if Memo is empty.
// ✅ Display a success message after the record is saved (if applicable through available client-side behavior).


// These exercises will give you hands-on practice with the most important Client Script entry points:

// pageInit()
// fieldChanged()
// validateField()
// saveRecord()


/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/ui/dialog'], function(dialog) {

    function pageInit(context) {

        const cr = context.currentRecord;
        const welMsg = cr.getText({
            fieldId: 'customform'
        })
        alert('welcome On: ' + welMsg );
    }

    function saveRecord(context) {

        const memo = context.currentRecord.getText({
            fieldId: 'memo'
        })

        if(!memo){
            dialog.alert({
                title : 'Warning',
                message: 'Please Filll the Memo field'
            })
            return false;
        }
        else{

            var confirm_Msg = confirm('Do You Really Want to Sumbit record..........?');
            
            if(confirm_Msg){
                return true;
            }
            else{
                return false;
            }
        }


    }

    function validateField(context) {
       
    }

    function fieldChanged(context) {
         const cr = context.currentRecord;
        if(context.fieldId == 'entity'){
              const customer_name = cr.getText({
            fieldId: 'entity'
        })

        const sales_person = cr.getText({
            fieldId: 'salesrep'
        })

        if(!customer_name){
            alert('Please enter customer_name');
        }
        else{
            cr.setValue({
                fieldId: 'memo',
                value: 'This Order are maked for'+ customer_name + 'And maked by' + sales_person
            })
        }
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
        // ✅ Prevent quantity greater than 100.
        const cr = context.currentRecord;
        const sublistId = context.sublistId;

        if(sublistId === 'item' && cr.getCurrentSublistValue({sublistId:'item',fieldId: 'quantity'}) > 100){
            dialog.alert({
                title: 'Warning.....!',
                message: 'Please enter quantity less than 100...!'
            })
            return false;
        }
        return true;
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
        validateLine: validateLine,
        // sublistChanged: sublistChanged
    }
});
