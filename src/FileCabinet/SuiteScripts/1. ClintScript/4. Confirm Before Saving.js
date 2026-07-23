// Memo is not empty.
// Customer is selected.
// Total amount is greater than 0.
/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/ui/dialog'], function(dialog) {

    function pageInit(context) {
        alert('Page are inited');
    }

    function saveRecord(context) {

        const cr = context.currentRecord;

        const memo_value = cr.getValue({
            fieldId:'memo'
        });
        
        console.log('Memo Value: ',memo_value);

        if(!memo_value){
            dialog.alert({
                title: 'Memo Are Empty..',
                message: 'Please Fill the Memo....!'
            });
            return false;
        }
        const total_ = cr.getValue({
            fieldId:'total'
        });

        console.log('total: ' + total_);

        if(total_ <= 0 ){
            dialog.alert({
                title: 'Total are Zero',
                message: 'Total are zero Please Select The to Make sales Order.......!'
            });
            return false;
        }

         const cust_name = cr.getText({
            fieldId : 'entity'
            });

            console.log("Customer name: " + cust_name);

            if(!cust_name){
                dialog.alert({
                    title: 'Customer field are empty.',
                    message: 'Please enter select the Customer...!'
                });

                return false;
            }
        var confirm_native = confirm('Do You Want To Really Summit...!');

        if(confirm_native){
            return true;
        }
        else{
            return false;
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
