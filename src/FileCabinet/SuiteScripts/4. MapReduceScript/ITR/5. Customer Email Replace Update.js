/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/log', 'N/runtime','N/search'], 
    (record, log, runtime, search) => 
{

            const getInputData = (context) => 
            {
                    try 
                    {
                        const scriptParam = runtime.getCurrentScript().getParameter({
                            name: 'custscript_bits_email_scenario_param'
                        });

                        log.debug('Received Param', scriptParam);

                    var custSearch = search.create({
                            type: search.Type.CUSTOMER,
                            filters: [['email', 'contains', scriptParam]],
                            columns: ['internalid', 'email']
                        });
                        return custSearch;

                    } 
                      catch (e)
                       {
                        log.error('Error in getInputData', e);
                    }
            };


   function map(context) 
{
    try
     {
        log.debug('Map Context Value', context.value);

        const result = JSON.parse(context.value);

       
        const custId = result.id; 
        const email = result.values.email; 

        log.debug('Processing Customer', `ID: ${custId}, Email: ${email}`);

        if (email && email.includes('@abc.com')) {
            const newEmail = email.replace('@abc.com', '@xyz.com');

            const recId = record.submitFields({
                type: record.Type.CUSTOMER,
                id: custId,
                values: {
                    email: newEmail
                }
            });

            log.debug('Customer Updated', `ID: ${recId}, New Email: ${newEmail}`);
        }
    } 
    catch (e) {
        log.error('Error in map function', e);
    }
};


    return { getInputData, map };
});
