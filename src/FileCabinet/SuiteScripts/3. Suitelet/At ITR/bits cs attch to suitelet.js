/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/ui/dialog', 'N/ui/message', 'N/url'],

    (currentRecord, dialog, message, url) => {
        /**
       * Function to be executed after page is initialized.
       *
       * @param {Object} scriptContext
       * @param {Record} scriptContext.currentRecord - Current form record
       * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
       *
       * @since 2015.2
       */
        function pageInit(scriptContext) {

        }

        function openSuitletButtonClick() {

            alert("Suitlet open");

            const record = currentRecord.get();
            const recId = record.id;
            alert('recId', recId);
            var suiteletUrl = url.resolveScript({
                scriptId: 'customscript_bits_ss_soreference',
                deploymentId: 'customdeploy_bits_ss_soreference',
                params: {
                    recId: recId
                }
            });
            //window.location.href = suiteletUrl;
            window.open(suiteletUrl, '_blank');
            //window.open(suiteletUrl, 'ModalWindow', 'width=1000,height=700,resizable=yes,scrollbars=yes');

        }
        return {
            pageInit,
            openSuitletButtonClick
        };
    });