/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/url'],
/**
 * @param{url} url
 */
function(url) {
    
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

    function printButton(scriptContext) {
        const url_ = url.resolveScript({
            scriptId: '',
            developmentId: '',
            params: {

            }
        })
        window.open(url_, '_blank');
    }


    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {

    }

    return {
        pageInit: pageInit,
        saveRecord: saveRecord
    };
    
});
