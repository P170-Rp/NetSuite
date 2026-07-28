/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/log'], 
    (search, record, log) => {

    const getInputData = () => {
        try {
            const customerSearch = search.create({
                type: search.Type.CUSTOMER,
                filters: ['email', 'isempty', ''], 
                columns: ['internalid', 'email']
            });
            return customerSearch;
        } catch (e) {
            log.error('Error in getInputData', e);
        }
    };

    const map = (context) => {
        try {
            const result = JSON.parse(context.value);

            const custId = result.id;
            const email = result.values.email;

            log.debug('Processing Customer', `ID: ${custId}, Email: ${email}`);

            // Example condition: clear email if it matches this value
           // if (email === 'balvirt@abc.com') {
                const recId = record.submitFields({
                    type: record.Type.CUSTOMER,
                    id: custId,
                    values: {
                        email: 'balvirt@abc.com' 
                    }
                });
                log.debug('Customer Updated', `ID: ${recId}`);
            
        } catch (e) {
            log.error('Error in map function', e);
        }
    };

    return { getInputData, map };
});
