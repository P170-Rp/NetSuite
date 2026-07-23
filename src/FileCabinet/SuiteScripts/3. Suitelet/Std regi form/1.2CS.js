/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/url', 'N/currentRecord'], function(url, currentRecord) {

    function pageInit(context) {

    }

    function registrationform() {
        const rec = currentRecord.get();
        const recId = rec.id;

        if (!recId) {
            alert('Please save the record before generating the registration form.');
            return;
        }

        const stdurl = url.resolveScript({
            scriptId: 'customscript_bits_student_registration_f',
            deploymentId: 'customdeploy_bits_student_registration_f',
            params: {
                recId: recId
            }
        });

        window.open(stdurl, '_blank');
    }

    return {
        pageInit: pageInit,
        registrationform: registrationform
    };
});