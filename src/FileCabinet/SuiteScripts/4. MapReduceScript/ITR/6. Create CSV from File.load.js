
/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/file', 'N/log'], (file, log) => {

    const getInputData = () =>
   {
        let csvFile = file.load({ id: 2887 });   // Load CSV file
        let contents = csvFile.getContents();

        let rows = contents.split('\n');
        let data = [];
    
        for (let i = 1; i < rows.length; i++) 
       {
            let cols = rows[i].split(',');
            if (cols.length >= 7) {
                data.push({
                    internalId: cols[0],
                    TransId: cols[1],
                    Customer: cols[2],
                    Date: cols[3],
                    Status: cols[4],
                    Currency: cols[5],
                    Amount: parseFloat(cols[6]) || 0   
                });
            }
        }
        return data;
    };

    const map = (mapContext) => 
    {
        let Sales = JSON.parse(mapContext.value);
        let customerName = Sales.Customer;
        let amount = Sales.Amount;

        if (amount > 200) 
        {
            log.debug("Amount Greater than 200", `Customer: ${customerName} | Amount: ${amount}`);

            mapContext.write({
                key: Sales.internalId,           
                value: JSON.stringify(Sales)    
            });
        }
    };

    const summarize = (summaryContext) => {
        let csvContent = "TransId,Date,Customer,Amount\n";

        summaryContext.output.iterator().each((key, value) =>
         {
            if (!value) return true; 

            let line = JSON.parse(value); 
            csvContent += `${line.TransId},${line.Date},${line.Customer},${line.Amount}\n`;
            return true;
        });

        try {
            let csvFile = file.create({
                name: 'Sales Order Amount.csv',
                fileType: file.Type.CSV,
                contents: csvContent,
                folder: 138
            });

            let csvId = csvFile.save();
            log.audit("File Saved Successfully", `File ID: ${csvId}`);
        } catch (e) 
        {
            log.error("Error while saving the file", e.message);
        }
    };

    return { getInputData, map, summarize };
});

