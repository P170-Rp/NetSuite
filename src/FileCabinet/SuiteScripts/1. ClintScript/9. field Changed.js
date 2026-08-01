
/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define([], ()=> {

    function fieldChanged(context) {
        const cr = context.currentRecord;
        if(context.sublistId === 'item') {
            const total_line = cr.getLineCount({
                sublistId: 'item'
            })
            let total_amount = 0;

            for (let i = 0; i < total_line; i++) {
                const amount = cr.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'amount',
                    line: i
                });

                total_amount += Number(amount || 0);
            }

            cr.setValue({
                fieldId: 'memo',
                value: total_amount
            })
        }
    }


    return {

        fieldChanged: fieldChanged,

    }
});
