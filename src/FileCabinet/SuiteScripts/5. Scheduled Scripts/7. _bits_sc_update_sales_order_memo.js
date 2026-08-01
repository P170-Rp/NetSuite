/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/log', 'N/record', 'N/runtime', 'N/search', 'N/task'],
    /**
 * @param{log} log
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 * @param{task} task
 */

// 5. Update Sales Order Memo
//
// Add "Reviewed by Scheduled Script" to all Pending Fulfillment Sales Orders.
//
    (log, record, runtime, search, task) => {

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        const execute = (scriptContext) => {

            let rescheduledTask= (currentScript) => {
                task.create({
                    type: task.TaskType.SCHEDULED_SCRIPT,
                    scriptId: currentScript.scriptId,
                    deploymentId: currentScript.deploymentId,
                }).submit();
            }
            let salesorderSearchObj = null;
            try{
                 salesorderSearchObj = search.create({
                    type: "salesorder",
                    settings:[{"name":"consolidationtype","value":"ACCTTYPE"}],
                    filters:
                        [
                            ["type","anyof","SalesOrd"],
                            "AND",
                            ["memo","isempty",""],
                            "AND",
                            ["status","anyof","SalesOrd:B"]
                        ],
                    columns:
                        [
                            'trandate', 'tranid', 'entity', 'account', 'memo', "internalid"
                        ]

                });
                const searchResultCount = salesorderSearchObj.runPaged().count;
                log.debug("salesorderSearchObj result count",searchResultCount);
            }catch(e){
                log.debug({
                    title: 'Error in Search creation',
                    details: e.message + '\n' + e.stack,
                })
            }

            try
            {
                let total = 0;
                let currentScript = runtime.getCurrentScript();
                salesorderSearchObj.run().each(function(result){
                    if(currentScript.getRemainingUsage() < 100){

                        log.audit({
                            title: 'Rescheduling Script',
                            details: 'Remaining Usage: ' + currentScript.getRemainingUsage()
                        });

                        rescheduledTask(currentScript);
                        return false;
                    }
                    let so = result.getValue('internalid');

                    // let rec = record.load({
                    //      type: record.Type.SALES_ORDER,
                    //      id: so,
                    //  })
                    //  rec.

                    record.submitFields({
                        type: record.Type.SALES_ORDER,
                        id: so,
                        values:{
                            memo: "Reviewed by Scheduled Script"
                        }
                    });

                    log.debug({
                        title: 'SalesOrder Memo updated',
                        details: 'salesorder Updated of ' +'|'+ so,
                    })
                    total++;
                    return true;
                });

                log.debug('Total Memo Updated', total);
            }catch(err){
                log.debug({
                    title: 'Error in each loop',
                    details: err,
                })
            }
            log.debug('scheduled script execution are ended', 'scheduled script execution are ended');
        }

        return {execute}

    });
