/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @
 */
define(['N/record', 'N/search', 'N/query', 'N/runtime', 'N/log', 'N/file'],
    (record, search, query, runtime, log, file) => {
        function getInputData(getInputContext) {
            var purchSql = `
            SELECT
                tr.id,
                tr.trandate AS date,
                v.entityid AS vendor,
                i.itemid as item,
                tl.netamount AS amt
            FROM TRANSACTION tr
            JOIN transactionline tl
                ON tr.id = tl.transaction
            LEFT JOIN vendor v
                ON tr.entity = v.id
             LEFT JOIN item i
                ON tl.item = i.id
            WHERE tr.type = 'PurchOrd'
              AND tl.netamount > 0
        `;

            const result = query.runSuiteQL({ query: purchSql }).asMappedResults();
            return result;
        }

        function map(mapContext) {
            var data = JSON.parse(mapContext.value);
            var entity = data.vendor;

            let purchData =
            {
                id: data.id,
                date: data.date,
                item: data.item,
                amt: parseFloat(data.amt)
            };

            mapContext.write({
                key: entity,
                value: JSON.stringify(purchData)
            });
        }

        function reduce(reduceContext) {
            var vendor = reduceContext.key;
            let total = 0;
            let obj = null;

            reduceContext.values.forEach(value => {
                obj = JSON.parse(value);
                total += parseFloat(obj.amt);
            });

            log.debug("Reduce Stage", `ID: ${obj.id}, Date: ${obj.date}, Vendor: ${vendor}, Item : ${obj.item}, Total: ${total}`);

            var data = {
                id: obj.id,
                date: obj.date,
                item: obj.item,
                total: total

            }
            reduceContext.write({
                key: vendor,
                value: data
            });
        }


        function summarize(summaryContext) {

            
            let csvContent = "Id,Date,Vendor,Item,Total\n";


            summaryContext.output.iterator().each((key, value) => {
                let line = JSON.parse(value);
                csvContent += `${line.id},${line.date},${key},${line.item},${line.total}`;
                return true;

            });
            try {
                let csvFile = file.create({
                    name: 'Demo Purchase Total.csv',
                    fileType: file.Type.CSV,
                    contents: csvContent,
                    folder: 791

                });
                var Id = csvFile.save();
                log.debug("File Saved Success ", `file Id : ${Id}`);
            }
            catch (e) {
                log.error("Error while Saving the record", e.message);
            }
        }

        return { getInputData, map, reduce, summarize };
    });