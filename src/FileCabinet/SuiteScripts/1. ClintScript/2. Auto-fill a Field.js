
// When the user selects a customer, automatically fill the Memo field with: customer name and some text

/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/currentRecord', 'N/ui/message', 'N/ui/dialog'],
    (currentRecord,message,dialog) => {

    function pageInit(context) {
        console.log('pageInit');
    }

    function saveRecord(context) {
        console.log('reco Saved');
    }

    // Fail to evaluate script: {"type":"error.SuiteScriptModuleLoaderError",
    // "name":"UNEXPECTED_ERROR",
    // "message":"illegal character (SS_SCRIPT_FOR_METADATA#31)",
    // "stack":[]}

    function fieldChanged(context) {
        const cr = context.currentRecord;

        if(context.fieldId == 'entity') {
            const cust_name = cr.getText({
                fieldId: 'entity'
            })

            cr.setValue({
                fieldId: 'memo',
                value: `${cust_name} customore are buying goods.`,
                ignoreFieldChange: true
            })
        }
    }


    return {
        pageInit: pageInit,
        saveRecord: saveRecord,
        fieldChanged: fieldChanged,
    }
});
