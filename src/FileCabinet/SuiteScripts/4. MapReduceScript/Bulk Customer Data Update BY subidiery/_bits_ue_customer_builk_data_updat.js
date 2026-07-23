/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 * Script ID: customscript_bits_ue_bulk_cust
 *
 * Adds an "Update Bulk Customer Data" button to the Customer record
 * form. Clicking it runs openBulkUpdate() in the attached client
 * script, which redirects to the Bulk Customer Update Suitelet.
 *
 * NOTE: This script's deployment must have the Client Script field
 * (customscript_bits_cs_bulk_cust) set as the "Client Script" on the
 * script record, OR set clientScriptModulePath below to the client
 * script's file path, e.g.:
 *   context.form.clientScriptModulePath = './_bits_cs_customer_bulk_data_update.js';
 */
define([], () => {

    function beforeLoad(context) {

        // Only show the button on view/edit, not on create.
        if (context.type === context.UserEventType.CREATE) {
            return;
        }

        const form = context.form;

        // Point at the client script that holds openBulkUpdate().
        // Update this path to match where the file lives in your File Cabinet.
        form.clientScriptModulePath = './_bits_cs_customer_bulk_data_update.js';

        form.addButton({
            id: 'custpage_update_bulk_customer_data',
            label: 'Update Bulk Customer Data',
            functionName: 'openBulkUpdate'
        });
    }

    function beforeSubmit(context) {

    }

    function afterSubmit(context) {

    }

    return {
        beforeLoad: beforeLoad
        // beforeSubmit: beforeSubmit,
        // afterSubmit: afterSubmit
    };
});