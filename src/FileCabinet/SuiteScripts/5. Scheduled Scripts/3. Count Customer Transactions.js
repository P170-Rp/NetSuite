// 6. Count Customer Transactions
// Calculate total transactions for each customer and store in a custom field.

/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/file', 'N/query', 'N/record', 'N/runtime', 'N/task', 'N/search'],
    /**
 * @param{file} file
 * @param{query} query
 * @param{record} record
 * @param{runtime} runtime
     *@param{task} task
    *@param{search} search **/
    (file, query, record, runtime, search, task) => {

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */

        const GOV = (currentScript) =>{
                log.debug({
                    title: 'Low Governance',
                    details: 'Rescheduling Script ' + '|' + currentScript.getRemainingUsage(),
                });
                task.create({
                    taskType: task.Type.SCHEDULED_SCRIPT,
                    scriptId: currentScript.id,
                    deploymentId: currentScript.deploymentId,

                }).submit();

        }
        const execute = (scriptContext) => {

                const sql =   `
                                SELECT
                    customer.id,
                    customer.entityid,
                    customer.companyname,
                    COUNT(transaction.id) AS total_transactions
                FROM
                    customer
                LEFT JOIN
                    transaction 
                    ON transaction.entity = customer.id
                GROUP BY
                    customer.id,
                    customer.entityid,
                    customer.companyname
                ORDER BY
                    total_transactions DESC;
                `

            let QueryResult = [];
            try
            {
               QueryResult = query.runSuiteQL({query: sql}).asMappedResults();
               log.debug({
                   title: 'QueryResult',
                   details: QueryResult,
               });

            }
            catch (error) {
                    log.debug({
                        title: 'Error Query',
                        details: error +'|'+ 'Error In Query',
                    })
            }

            try {

                const len = QueryResult.length;
                log.debug({title: 'Array Length', details: len});
                const currentScript = runtime.getCurrentScript();
                for(let i = 0; i < QueryResult.length; i++) {
                if (currentScript.getRemainingUsage() < 100) {
                    GOV(currentScript);
                    return;
                }

                const item = QueryResult[i];

                // let rec =  record.load({
                //       type: record.Type.CUSTOMER,
                //       id: item.id,
                //   })
                //
                //  let val =  rec.getValue({fieldId: 'custentity_bits_total_sales_order'});


                    try {
                        let val = search.lookupFields({
                            type: search.Type.CUSTOMER,
                            id: item.id,
                            columns: ['custentity_bits_total_sales_order'],
                        })

                        if (!val.custentity_bits_total_sales_order) {
                            record.submitFields({
                                type: record.Type.CUSTOMER,
                                id: item.id,
                                values: {
                                    custentity_bits_total_sales_order: item.total_transactions
                                }
                            })
                            log.debug({
                                title: 'Record Updated',
                                details: item.id,
                            })
                        }
                    }catch(error){
                            log.debug({title: 'Error Updating Customer ' + '|' +item.id, details: error });
                    }
                }
            }catch(error){
                log.debug({
                    title: 'Error in Record Updation',
                    details: error +'|'+ 'Error In Record Updation',
                })
            }

            log.debug({
                title: 'Script execution is ended',
                message: 'Script execution is ended'+ '|'+ runtime.getCurrentScript().getRemainingUsage(),
            })
        }

        return {execute}

    });
