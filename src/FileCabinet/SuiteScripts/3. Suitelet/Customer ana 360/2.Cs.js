/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/url', 'N/currentRecord'], (url, currentRecord) => {

    const pageInit = (context) => {

    };

    const openSuitletButtonClick = () => {

        const record = currentRecord.get();
        const recId = record.id;

        if (!recId) {
            alert('Please save this record before opening the Customer Analysis page.');
            return;
        }

        const entityId = record.getValue({
            fieldId: 'entity'
        });

        try {
            const suiteletUrl = url.resolveScript({
                scriptId: 'customscript_bits_2suitelet',
                deploymentId: 'customdeploy_bits_2suitelet',
                params: {
                    recId: recId,
                    entityId: entityId
                }
            });

            // window.location.href = suiteletUrl;
            window.open(suiteletUrl, '_blank');

            // window.open(
            //     suiteletUrl,
            //     'ModernView',
            //     'width=1000,height=560,resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no,location=no'
            // );
        } catch (e) {
            alert('Unable to open the Customer Analysis page: ' + e.message);
        }
    };

    return {
        pageInit: pageInit,
        openSuitletButtonClick: openSuitletButtonClick
    };
});