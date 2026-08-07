/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget', 'N/url'],
    /**
 * @param{serverWidget} serverWidget
     @param{url} url
 */
    (serverWidget, url) => {
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
            // scriptContext.form.clientScriptModulePath = './_bits_CS_print_button_function';
            let id = scriptContext.newRecord.id;
            log.debug('beforeLoad',id);

            const url_ = url.resolveScript({
                scriptId: 'customscript_bits_sl_render_print_',
                deploymentId: 'customdeploy_bits_sl_render_print_',
                params: {
                    custscript6: id,
                }
            })

            scriptContext.form.addButton({
                label: 'Print',
                id: 'custpage_printButton',
                functionName: `window.open( '${url_}', '_blank')`,
            })
        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {

        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {

        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
