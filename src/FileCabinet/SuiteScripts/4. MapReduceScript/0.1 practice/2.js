// Scenario 1: The Bulk Price Updater (Data Manipulation)The Problem: A manufacturing client updates 
// their product catalog every quarter. You need to increase the price of all active items by 5% across 
// thousands of SKU entries.
// Your Task:Use getInputData to query all active inventory items using a Saved Search.
// Skip the map stage (pass data directly to reduce) or use map to group items by Item Category.In the reduce 
// stage, load each item, calculate the new base price (old price * 1.05), and save the record.In the summarize 
// stage, log the total number of items updated.

/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 */
define(['N/query', 'N/search', 'N/log', 'N/record'], () => {

    function getInputData() {
        try {
            const itemSearch = search.create({
                type: search.Type.INVENTORY_ITEM,
                filters: [
                    ['isinactive', 'is', 'F']
                ],
                columns: [
                    'internalid',
                    'itemid',
                    'baseprice',
                    'custitem_item_category'
                ]
            });

            log.audit('getInputData', 'Saved search created, fetching results');
            return itemSearch;
        } catch (error) {
            log.error('Error', error)
        }
    }

    function reduce(context) {

        const result = JSON.parse(context.values);

    }

    function summarize(summary) {

    }

    return {
        getInputData: getInputData,
        reduce: reduce,
        summarize: summarize
    }
});
