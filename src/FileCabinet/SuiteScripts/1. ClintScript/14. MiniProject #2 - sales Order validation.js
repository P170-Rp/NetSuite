
/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/ui/message'], function (message) {

    function pageInit(context) {
        const mymsg = message.create({
            type: message.Type.CONFIRMATION,
            title: 'Welcome',
            message: 'Welcome Sir..................!'
        });

        mymsg.show({
            duration: 5000
        })

        console.log('Todays Date: ',new Date());
    }

    function saveRecord(context) {
        const Discount_total = context.currentRecord.getValue({
            fieldId: 'discounttotal',
        })

        const total_ = context.currentRecord.getValue({
            fieldId: 'total',
        })

        const cust_name = context.currentRecord.getText({
            fieldId: 'entity'
        })

        const memo_ = context.currentRecord.getText({
            fieldId: 'memo'
        })

        if (Discount_total > total_) {
            const mymsg = message.create({
                type: message.Type.ERROR,
                title: 'Discount ERROR',
                message: 'Discount are Highre than Total Amount'
            })
            mymsg.show({
                duration: 5000
            })

            return false;
        }

        if (!cust_name) {
            const mymsg = message.create({
                type: message.Type.ERROR,
                title: 'Customer Error',
                message: 'Must be fill Customer Fied........!'
            })

            mymsg.show({
                duration: 5000
            })

            return false;
        }

        if (!memo_) {
            const mymsg = message.create({
                type: message.Type.ERROR,
                title: 'MEMO FIELD ERROR',
                message: 'Memo is Empty.....!'
            })

            mymsg.show({
                duration: 5000
            })
            return false;
        }

        const total_line = context.currentRecord.getLineCount({
            sublistId: 'item'
        })

        const total_Amount = context.currentRecord.getValue({
            fieldId: 'total'
        })

        alert(`Total Items Is: ${total_line} \n Total Amount is: ${total_Amount}`);


        var confirm_ = confirm('Do you really want to save this Sales Order?');
        if (confirm_) {
            return true;
        }
        else {
            return false
        }

        return true;
    }

    function validateField(context) {

    }

    function fieldChanged(context) {
        if (context.Field == 'entity') {
            const cust_name = context.currentRecord.getText({
                filedId: 'entity',
            })

            const salesMan = context.currentRecord.getText({
                fieldId: 'salesrep',
            })

            context.currentRecord.setValue({
                fieldId: 'memo',
                value:
                    'Sales Order created for ' +
                    cust_name +
                    ' by ' +
                    salesMan
            })
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
        if (context.sublistId == 'item') {
            const qut = context.currentRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'quantity'
            })

            if (qut <= 1) {
                const mymsg = message.create({
                    type: message.Type.ERROR,
                    title: 'Quantity',
                    message: ' Quantity must be  more then 1...! and also greater than zero....!'
                })

                mymsg.show({
                    duration: 5000
                })
                return false;
            }

            const Rate = context.currentRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'rate'

            })


            if (Rate <= 0) {
                const mymsg = message.create({
                    type: message.Type.ERROR,
                    title: 'Rate Error',
                    message: 'Negative rate is not allowed.'
                })

                mymsg.show({
                    duration: 50000000
                })

                return false;
            }
        }

        return true;
    }

    function sublistChanged(context) {

    }

    return {
        pageInit: pageInit,
        saveRecord: saveRecord,
        validateField: validateField,
        fieldChanged: fieldChanged,
        postSourcing: postSourcing,
        lineInit: lineInit,
        validateDelete: validateDelete,
        validateInsert: validateInsert,
        validateLine: validateLine,
        sublistChanged: sublistChanged
    }
});
