/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/log'],
    
    (log) => {

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        const execute = (scriptContext) => {
            log.debug({
                title: 'Execute',
                detail: 'Execute',
            });
        }

        return {execute}

    });
