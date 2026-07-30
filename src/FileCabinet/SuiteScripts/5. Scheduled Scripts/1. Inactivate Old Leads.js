

// 2. Inactivate Old Leads
//
// Mark leads as inactive if they haven't been updated in the last 180 days.

/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/file', 'N/query', 'N/record'],
    /**
 * @param{file} file
 * @param{query} query
 * @param{record} record
 */
    (file, query, record) => {

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        const execute = (scriptContext) => {
            const sql = `SELECT id,
                                entityid,
                                companyname,
                                email,
                                lastmodifieddate,
                                isinactive
                         FROM customer
                         WHERE isinactive = 'F'
                           AND lastmodifieddate < (CURRENT_DATE - 20)
                         ORDER BY id ASC`;

            let QueryResult = [];
            try {
                QueryResult = query.runSuiteQL(sql).asMappedResults();
                log.debug('Query Result:', QueryResult);
                log.debug('Length of the Array:', QueryResult);
            } catch (err) {
                log.debug('Error in Query...', '');
                log.debug(err.message);
                log.debug(err.stack);
            }
            let len = QueryResult.length;
            try {
                for (let i = 0; i < len; i++) {
                    let row = QueryResult[i];

                    let rec = record.load({
                        type: record.Type.LEAD,
                        id: row.id,
                    })

                    rec.setValue({
                        fieldId: 'isinactive',
                        value: true,
                    });

                    let recId = rec.save();
                    log.debug({
                        title: 'Lead Updated',
                        details: recId + ' :Updated'
                    })
                }
            } catch (err) {
                log.debug('Error in  Update loop', '');
                log.debug(err.message);
            }

            try{
                csvContent = 'id, entityid, companyname, email, lastmodifieddate\n'
                QueryResult.forEach(row => {
                    csvContent += `"${row.id}", "${row.entityid}", "${row.companyname}","${row.email}", "${row.lastmodifieddate}"\n`;
                })

                const F = file.create({
                    name: 'Isinactivited Data 20 days old lead data....',
                    contents: csvContent,
                    fileType: file.Type.CSV,
                    folder: 137,
                })

                const fileId =  F.save();
                log.debug({
                    title: fileId,
                    details: 'File created successfully.',
                })
            }catch(e){
                log.debug({
                    title: 'Error in File Creation Block',
                    details: e.message + ' | ' + e.stack
                });
            }
        }
        return {execute}

    });
