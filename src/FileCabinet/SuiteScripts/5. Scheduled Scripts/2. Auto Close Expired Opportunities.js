/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/email', 'N/file', 'N/query', 'N/record', 'N/runtime'],
    /**
 * @param{email} email
 * @param{file} file
 * @param{query} query
 * @param{record} record
     * @param{runtime} runtime
 */
    (email, file, query, record,runtime) => {

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        const execute = (scriptContext) => {
            const sql =    `
                SELECT
                    id,
                    tranid,
                    expectedclosedate,
                    BUILTIN.DF(entitystatus) as entitystatus
                FROM
                    transaction
                WHERE
                    type = 'Opprtnty'
                    AND entitystatus NOT IN (13, 14)
            `;

            let QueryResult = []
            try{
                QueryResult = query.runSuiteQL({query: sql}).asMappedResults();
                log.debug('Query Result from query', QueryResult);
            }catch(e){
                log.error('Error in query', e.message);
            }

            log.debug('Query Result Length: ', QueryResult.length);
            let today = new Date();


           let csv_content = `id, tranid, expectedclosedate, entitystatus\n`;
            try{
                QueryResult.forEach(row => {
                    let closeDate = new Date(row.expectedclosedate);
                    QueryResult.forEach(row => {

                        const closeDate = new Date(row.expectedclosedate);

                        log.debug({
                            title: row.tranid,
                            details: 'Close Date=' + closeDate +
                                ' | Today=' + today +
                                ' | Expired=' + (today > closeDate)
                        });

                    });
                    try
                    {
                        if(today > closeDate) {
                            // let rec = record.load({
                            //     type: record.Type.OPPORTUNITY,
                            //     id: row.id,
                            // })
                            //
                            // rec.setValue({
                            //     fieldId: 'entitystatus',
                            //     value: 14
                            // }).ignoreMandatoryFields = true;
                            //
                            // let recId = rec.save();
                            // log.debug('Opportunity Closed', recId);

                            record.submitFields({
                                type: record.Type.OPPORTUNITY,
                                id: row.id,
                                values:{
                                    entitystatus: 14,
                                },
                                options: {
                                    enableSourcing: false,
                                    ignoreMandatoryFields : true
                                }
                            });
                            log.debug('Record Status Changed Of: ', row.id);
                            csv_content += `"${row.id}", "${row.tranid}", "${row.expectedclosedate}", "${row.entitystatus}"\n"`;
                        }
                    }catch (e){
                        log.debug({
                            title: 'Error Inside the if block..',
                            details: e.message +'|'+ e.stack,
                        })
                    }

                })
            }catch(e){
                log.debug({
                    title: 'Record Closed Expired Opportunities',
                    details: e.message +' | '+ e.stack
                })
            }

            try{
                const F = file.create({
                    name: 'Data Of All Closed Opportunitie.csv',
                    fileType: file.Type.CSV,
                    contents: csv_content,
                    folder:137
                })

                const fileId = F.save();
                log.debug({
                    title: 'Record Updated', details: "File ID: " + fileId,
                })
            }catch (e) {
                log.debug('Error in File creation', e.message);
            }

            log.debug({
                title: 'Scheduled scripts execution are ended',
                details: runtime.getCurrentScript().getRemainingUsage(),
            })
        }

        return {execute}

    });
