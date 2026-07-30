/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/log', 'N/runtime', 'N/search', 'N/task', 'N/record'],
    /**
 * @param{log} log
 * @param{runtime} runtime
 * @param{search} search
 * @param{task} task
     * @Param{record} record
 */
    (log, runtime, search, task, record) => {

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        const CUSTOMER_IDS = [30, 31, 32, 33, 34, 35, 36, 37];

        const execute = (scriptContext) => {

            log.debug({
                title: 'SCHEDULED',
                details: 'Script started'
            });

            let processedCount = 0;
            let errorCount = 0;

            // Search to confirm which of these customers exist and pull their current comments
            const customerSearch = search.create({
                type: search.Type.CUSTOMER,
                filters: [
                    ['internalid', 'anyof', CUSTOMER_IDS]
                ],
                columns: ['internalid', 'entityid', 'comments']
            });

            customerSearch.run().each((result) => {
                const customerId = result.getValue('internalid');
                const entityId = result.getValue('entityid');

                try {
                    record.submitFields({
                        type: record.Type.CUSTOMER,
                        id: customerId,
                        values: {
                            comments: 'Test Update'   // different field entirely
                        }
                    });

                    processedCount++;

                    log.debug({
                        title: 'Customer updated',
                        details: `Customer ${customerId} (${entityId}) - comments updated`
                    });

                } catch (e) {
                    errorCount++;
                    log.error({
                        title: `Failed to update customer ${customerId}`,
                        details: JSON.stringify({
                            message: e.message,
                            name: e.name,
                            id: e.id
                        })
                    });
                }

                return true; // continue to next result
            });

            log.debug({
                title: 'SCHEDULED',
                details: `Execution ended. Processed: ${processedCount}, Errors: ${errorCount}`
            });
        };
        return {execute}

    });
