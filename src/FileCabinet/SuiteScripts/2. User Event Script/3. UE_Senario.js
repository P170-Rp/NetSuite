/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record',
    'N/runtime',
    'N/ui/serverWidget'],
    function (record, runtime, serverWidget) {

        // Display the current logged-in user's name.
        // Add a custom field named Current User to the form.
        // Populate it with the current user's name.
        // Make the field read-only.


        function beforeLoad(context) {
            context.form.clientScriptModulePath= './3.1Scenario Client.js';
           const user =  newRecord.form.addField({
                type: serverWidget.FieldType.TEXT,
                id: 'custpage_current_user',
                label: 'Current User'
            })

            user.defaultValue = runtime.getCurrentUser().name;

            const userField = context.form.getField({
                id: 'custpage_current_user',
            });

            userField.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            })
        }

        function beforeSubmit(context) {
            // Automatically set the customer's Comments field.
            // Include the logged-in user's name and today's date.

            context.newRecord.setValue({
                id: 'comments',
                value: 'Logined by:'+runtime.getCurrentUser().name +' Date:' + new Date()
            })

        }

        function afterSubmit(context) {

        }

        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit,
            // afterSubmit: afterSubmit
        }
    });
