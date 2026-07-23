/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/record', 'N/runtime'], function(record, runtime) {

    var newFeatureRecord;
    function pageInit(context) {

        if(context.mode == 'create'){
            newFeatureRecord = record.load({
                type: record.Type.CUSTOMER,
                id: 1667,
                isDynamic: true,
            });
        }
    }

    function saveRecord(context){
        newFeatureRecord.setText({
            fieldId: 'companyname',
            text: '_BITS_BALVIRT'
        })

        newFeatureRecord.setValue({
            fieldId: 'email',
            value: '_BITS_BALVIRT@gmail.com'
        })

        newFeatureRecord.setText({
            fieldId: 'phone',
            text: '9876543210'
        })

        newFeatureRecord.setValue({
            fieldId: 'comments',
            value: 'This is created by'+ runtime.getCurrentUser().name + new Date()
        })

        newFeatureRecord.setValue({
            fieldId: 'url',
            value: 'https://balvirt.com/'
        })

        newFeatureRecord.setValue({
            fieldId: 'fax',
            value: '9837759303848'
        })

        newFeatureRecord.setValue({
            fieldId: 'subsidiary',
            value: 5
        })

        console.log(newFeatureRecord.save());

        return true;
    }

    

    return {
        pageInit: pageInit,
        saveRecord: saveRecord,
    }
});
