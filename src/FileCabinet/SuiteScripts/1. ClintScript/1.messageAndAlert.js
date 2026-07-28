/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/ui/message', 'N/ui/dialog'], function(message, dialog) {

    function pageInit(context) {

        var msg = message.create({
            title: 'Information',
            message: 'Your page has been successfully loaded.',
            type: message.Type.INFORMATION
        });

        msg.show({
            duration: 5000
        });
    }

    function saveRecord(context) {

        var currentR = context.currentRecord;

        var memo = currentR.getValue({
            fieldId: 'memo'
        });

        if (!memo) {

            dialog.alert({
                title: 'Alert',
                message: 'Memo is empty.'
            });

            return false;
        }

        return true;
    }

    return {
        pageInit: pageInit,
        saveRecord: saveRecord
    };
});