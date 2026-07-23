/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 *
 */
define(['N/url'], (url) => {

    function pageInit(context) {

    }

    function openBulkUpdate() {
        try {
            const suiteletUrl = url.resolveScript({
                scriptId: 'customscript_bits_sl_bulkcustomerupload_',
                deploymentId: 'customdeploy_bits_sl_bulkcustomerupload',
                returnExternalUrl: false
            });

            window.location.href = suiteletUrl;

        } catch (e) {
            alert('Unable to open Bulk Customer Update page: ' + e.message);
        }
    }

    return {
        pageInit: pageInit,
        openBulkUpdate: openBulkUpdate
    };
});