
//Is Sales Order Client Script me ye features implement karke dekho:

// Customer select hote hi Terms automatically set karo.
// Agar Location empty ho to save mat hone do.
// Agar line me Rate < 0 ho to line commit mat hone do.
// Save hone se pehle total item count calculate karke alert me dikhao.

// Is exercise se fieldChanged(), validateField(), validateLine(), aur saveRecord() sabki aur achhi practice ho jayegi.

/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/ui/dialog'], function (dialog) {

    function pageInit(context) {
        alert('Hi');
    }

    function saveRecord(context) {
        const cr = context.currentRecord;
        const loc = cr.getValue({
            fieldId: 'location'
        })
        if(!loc){

            dialog.alert({
                title: 'Location Error.....!',
                message: 'Fill the Location Field'
            })
            return false;
        }
        const total_item = context.currentRecord.getLineCount({
            sublistId: 'item'
        })
        dialog.alert({
            title: 'Alert....!',
            message: 'Total Item Are Selected: ' + total_item
        })
        return true;
    }
    
    function fieldChanged(context) {
        const cr = context.currentRecord;
        const Customer_name = cr.getText({
            fieldId: 'entity'
        })
        if (Customer_name == 'Gentry Inc.' && cr.fieldId == 'entity') {
            cr.setValue({
                fieldId: 'terms',
                value: 3
            })
            
        }
    }
    
    function validateLine(context) {
        if (context.sublistId == 'item' &&
            context.currentRecord.getCurrentSublistValue(
                {
                    sublistId: 'item',
                    fieldId: 'rate'
                }) < 0) {
            dialog.alert({
                title: 'Rate Error......!',
                message: 'Please Enter Rate Of Item......!'
            });
            return false;
        }
        return true
    }
    return {
        pageInit: pageInit,
        saveRecord: saveRecord,
        fieldChanged: fieldChanged,
        validateLine: validateLine
    }
});
