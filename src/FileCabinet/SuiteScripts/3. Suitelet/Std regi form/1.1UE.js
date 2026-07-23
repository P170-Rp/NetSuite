/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/ui/serverWidget'], function (serverWidget) {

    function beforeLoad(context) {

        const form = context.form;

        form.clientScriptModulePath = './1.2CS.js';

        form.addButton({
            id: 'custpage_student_registration',
            label: 'Registration Form',
            functionName: 'registrationform'
        });

    }

    return {
        beforeLoad: beforeLoad,
        // beforeSubmit: beforeSubmit,
        // afterSubmit: afterSubmit
    }
});