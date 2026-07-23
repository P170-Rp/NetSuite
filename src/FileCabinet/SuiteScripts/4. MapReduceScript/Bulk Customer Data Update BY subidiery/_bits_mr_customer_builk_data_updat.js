/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 *
 * 
 */

define(['N/file', 'N/record', 'N/search', 'N/runtime', 'N/log'],
(file, record, search, runtime, log) => {

    function getInputData() {
        const scriptObj = runtime.getCurrentScript();
        const fileId = scriptObj.getParameter({ name: 'custscript2' });

        if (!fileId) {
            throw new Error('No file ID was passed to the Map/Reduce script.');
        }

        const csvFile = file.load({ id: fileId });
        const csvContents = csvFile.getContents();

        const lines = csvContents
            .split(/\r\n|\n/)
            .filter((line) => line.trim() !== '');

        if (lines.length < 2) {
            throw new Error('CSV file has no data rows (only a header, or is empty).');
        }

        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

        const identifierCols = ['internalid', 'email', 'entityid'];

        const identifiersPresent = identifierCols.filter((col) => headers.indexOf(col) !== -1);

        if (identifiersPresent.length === 0) {
            throw new Error(
                'CSV header must include exactly one unique identifier column: ' +
                'internalid, email, or entityid. Found columns: ' + headers.join(', ')
            );
        }

        if (identifiersPresent.length > 1) {
            throw new Error(
                'CSV header must include only ONE unique identifier column, found ' +
                identifiersPresent.length + ' (' + identifiersPresent.join(', ') + '). ' +
                'Please remove the extra identifier column(s) to avoid ambiguity.'
            );
        }

        const rows = [];
        for (let i = 1; i < lines.length; i++) {
            // NOTE: simple comma split — does not handle quoted commas.
            // If your CSV values may contain commas, swap this for a
            // proper CSV parser (e.g. PapaParse bundled as a library file).
            const values = lines[i].split(',').map((v) => v.trim());
            const rowObj = {};
            headers.forEach((header, idx) => {
                rowObj[header] = values[idx];
            });
            rows.push(rowObj);
        }

        log.audit({
            title: 'CSV Parsed',
            details: `${rows.length} data row(s) found, using "${identifiersPresent[0]}" as the identifier column, columns: ${headers.join(', ')}`
        });

        return rows;
    }

    // ---------------------------------------------------------------
    // 2. MAP — resolve each row to a customer internal ID
    // ---------------------------------------------------------------
    function map(context) {
        const scriptObj = runtime.getCurrentScript();
        const subsidiary = scriptObj.getParameter({ name: 'custscript3' });

        const row = JSON.parse(context.value);
        let customerId = null;

        try {
            if (row.internalid) {
                if (subsidiary) {
                    const belongs = customerBelongsToSubsidiary(row.internalid, subsidiary);
                    if (!belongs) {
                        log.error({
                            title: 'Subsidiary Mismatch',
                            details: 'Customer internalid ' + row.internalid +
                                ' does not belong to subsidiary ' + subsidiary + ' — skipped. Row: ' + JSON.stringify(row)
                        });
                        return;
                    }
                }

                customerId = row.internalid;

            } else if (row.email) {

                customerId = lookupCustomer('email', row.email, subsidiary);

            } else if (row.entityid) {

                customerId = lookupCustomer('entityid', row.entityid, subsidiary);

            } else {
                log.error({
                    title: 'Missing Identifier Column',
                    details: 'Row must contain internalid, email, or entityid: ' + JSON.stringify(row)
                });
                return;
            }

            if (!customerId) {
                log.error({
                    title: 'Customer Not Found',
                    details: JSON.stringify(row)
                });
                return;
            }

            context.write({
                key: customerId,
                value: JSON.stringify(row)
            });

        } catch (e) {
            log.error({
                title: 'Map Error',
                details: e.message + ' | Row: ' + JSON.stringify(row)
            });
        }
    }

    function lookupCustomer(fieldName, fieldValue, subsidiary) {
        const filters = [[fieldName, 'is', fieldValue]];

        if (subsidiary) {
            filters.push('AND', ['subsidiary', 'anyof', subsidiary]);
        }

        const custSearch = search.create({
            type: search.Type.CUSTOMER,
            filters: filters,
            columns: ['internalid']
        });

        const results = custSearch.run().getRange({ start: 0, end: 1 });
        return results.length > 0 ? results[0].getValue('internalid') : null;
    }

    function customerBelongsToSubsidiary(customerInternalId, subsidiary) {
        try {
            const fields = search.lookupFields({
                type: search.Type.CUSTOMER,
                id: customerInternalId,
                columns: ['subsidiary']
            });

            if (!fields.subsidiary || fields.subsidiary.length === 0) {
                return false;
            }
            return fields.subsidiary.some((s) => String(s.value) === String(subsidiary));

        } catch (e) {
            log.error({
                title: 'Subsidiary Lookup Error',
                details: 'Customer internalid ' + customerInternalId + ': ' + e.message
            });
            return false;
        }
    }
    function reduce(context) {
        const customerId = context.key;
        const row = JSON.parse(context.values[0]);

        const identifierCols = ['internalid', 'email', 'entityid'];

        const fieldsToUpdate = {};

        Object.keys(row).forEach((key) => {
            if (identifierCols.indexOf(key) === -1 && row[key] !== '' && row[key] !== undefined) {
                fieldsToUpdate[key] = row[key];
            }
        });

        if (Object.keys(fieldsToUpdate).length === 0) {
            log.debug({
                title: 'Nothing to Update',
                details: 'Customer ' + customerId + ' had no non-empty fields to set.'
            });
            return;
        }
        try {
            record.submitFields({
                type: record.Type.CUSTOMER,
                id: customerId,
                values: fieldsToUpdate,
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                }
            });
        } catch (e) {
            log.error({
                title: 'Reduce Error - Customer ' + customerId,
                details: 'Fields attempted: ' + JSON.stringify(fieldsToUpdate) + ' | Error: ' + e.message
            });
            throw e;
        }

        log.audit({
            title: 'Customer Updated',
            details: 'ID: ' + customerId + ' | Fields: ' + JSON.stringify(fieldsToUpdate)
        });
    }

    function summarize(summary) {
        let totalKeys = 0;
        let errorCount = 0;

        if (summary.inputSummary.error) {
            errorCount++;
            log.error({
                title: 'GetInputData Stage Error',
                details: summary.inputSummary.error
            });
        }

        summary.reduceSummary.keys.iterator().each(function () {
            totalKeys++;
            return true;
        });

        let reduceErrorCount = 0;
        summary.reduceSummary.errors.iterator().each(function (key, error) {
            errorCount++;
            reduceErrorCount++;
            log.error({
                title: 'Reduce Stage Error',
                details: 'Key: ' + key + ' | Error: ' + error
            });
            return true;
        });

        summary.mapSummary.errors.iterator().each(function (key, error) {
            errorCount++;
            log.error({
                title: 'Map Stage Error',
                details: 'Key: ' + key + ' | Error: ' + error
            });
            return true;
        });


        const updatedCount = totalKeys - reduceErrorCount;

        log.audit({
            title: 'Bulk Customer Update - Summary',
            details: 'Customers Updated: ' + updatedCount +
                      ' | Errors: ' + errorCount +
                      ' | Usage: ' + summary.usage +
                      ' | Concurrency: ' + summary.concurrency +
                      ' | Yields: ' + summary.yields
        });
    }

    return {
        getInputData,
        map,
        reduce,
        summarize
    };

});