/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/ui/serverWidget'],
    function (serverWidget) {

function beforeLoad(context) {
    if (context.type === context.UserEventType.DELETE) {
        return;
    }

    context.form.clientScriptModulePath = './2.Cs.js';
    context.form.addButton({
        id: 'custpage_open_cust_ana_360',
        label: 'Open Customer 360',
        functionName: 'openSuitletButtonClick'
    });
}
        return {
            beforeLoad: beforeLoad,
        }
    });