/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @Name
*/
define([
    'N/record',
    'N/search',
    'N/url'
],
    (record, search,url) => {
        /**
             * Defines the function definition that is executed before record is loaded.
             * @param {Object} scriptContext
             * @param {Record} scriptContext.newRecord - New record
             * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
             * @param {Form} scriptContext.form - Current form
             * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
             * @since 2015.2
             */
        const beforeLoad = (scriptContext) => {

            if (scriptContext.type === scriptContext.UserEventType.VIEW) {

                const form = scriptContext.form;

                var recId = scriptContext.newRecord.id;

                var suiteletUrl = url.resolveScript({
                    scriptId: 'customscript_bits_ss_rpt_custom_pdf',    
                    deploymentId: 'customdeploy_bits_ss_rpt_custom_pdf',
                    params: { id: recId }
                });

                form.addButton({
                    id: 'custpage_bits_open_suitelet_pdf_button',
                    label: 'PDF',
                    functionName: `window.open('${suiteletUrl}', '_blank')`
                })

            }
        };
        /**
               * Defines the function definition that is executed before record is submitted.
               * @param {Object} scriptContext
               * @param {Record} scriptContext.newRecord - New record
               * @param {Record} scriptContext.oldRecord - Old record
               * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
               * @since 2015.2
               */
        const beforeSubmit = (scriptContext) => {

        };
        /**
               * Defines the function definition that is executed after record is submitted.
               * @param {Object} scriptContext
               * @param {Record} scriptContext.newRecord - New record
               * @param {Record} scriptContext.oldRecord - Old record
               * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
               * @since 2015.2
               */
        const afterSubmit = (scriptContext) => {


        };
        return {
            beforeLoad,
            beforeSubmit,
            afterSubmit,
        };
    });