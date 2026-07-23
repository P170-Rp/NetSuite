/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/search',
    'N/runtime',
    'N/record',
    'N/ui/serverWidget'],
    function (search,
        runtime,
        record,
        serverWidget) {

        function beforeLoad(context) {
            const Credit_Status = context.form.addField({
                id: '_custField_Credit_Status',
                lable: 'Credit Status',
                type: serverWidget.FieldType.TEXT,
            });
            Credit_Status.updateDisplayType({
                type: serverWidget.FieldDisplayType.INLINE,
            });

            Credit_Status.defaultValue = 'Pending';

            const CurrentUserName = context.form.addField({
                type: serverWidget.FieldType.TEXT,
                id: '_custField_current_user_name',
                label: runtime.getCurrentUser().name
            });

            const cun = context.form.getText({
                id: _custField_current_user_name,
            });
            
            if(cun == 'Administrator'){
                context.form.addButton({
                    id: '_custField_Approve_Customer',
                    label: 'Approve Customer',
                    functionName: '',
                });

                return true;
            }

            const isInactive = context.form.getValue({
                fieldID: 'isinactive'
            });

            if(isInactive){
                context.form.clientScriptModulePath = './4.1 CS.js';
            }

            if(context.form.getValue({fieldId: 'balance'}) > 50000){
                const High_Credit_Risk = form.addField({
                    type: serverWidget.FieldType.RICHTEXT,
                    id: '_custField_High_Credit_Risk',
                    label: 'High Credit Risk'
                });
                High_Credit_Risk.defaultValue = 'yes'
            }


            if(context.type == context.userEventType.EDIT){
                context.form.getField({fieldId: 'comments'}).isMandatory = true;
            }


        }

        function beforeSubmit(context) {

            if(!context.form.getValue({id: 'comments'})){
                context.form.setValue({id: 'comments', value: 'This is created by' + runtime.getCurrentUser().name});
            }
        }

        function afterSubmit(context) {

        }

        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        }
    });
